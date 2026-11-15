import { Product } from '../models/Product.js';

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, searching, sorting, and pagination
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      dressStyle,
      minPrice,
      maxPrice,
      color,
      size,
      rating,
      search,
      q,
      sort,
      inStock,
      discounted,
      isNewArrival,
      isTopSelling,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const searchTerm = search || q;

    const filter = {};
    const andConditions = [];

    if (category && category !== 'all') {
      filter.category = String(category).toLowerCase().trim();
    }

    if (dressStyle && dressStyle !== 'all') {
      filter.dressStyle = String(dressStyle).toLowerCase().trim();
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && !isNaN(Number(minPrice))) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (rating && !isNaN(Number(rating))) {
      filter.rating = { $gte: Number(rating) };
    }

    if (color) {
      filter.colors = { $in: [String(color)] };
    }

    if (size) {
      filter.sizes = { $in: [String(size)] };
    }

    if (inStock !== undefined && String(inStock).toLowerCase() === 'true') {
      andConditions.push({ $or: [{ stockQuantity: { $gt: 0 } }, { stock: { $gt: 0 } }] });
    }

    if (discounted !== undefined && String(discounted).toLowerCase() === 'true') {
      andConditions.push({ $or: [{ discount: { $gt: 0 } }, { discountPercentage: { $gt: 0 } }] });
    }

    if (isNewArrival !== undefined) {
      filter.isNewArrival = String(isNewArrival).toLowerCase() === 'true';
    }

    if (isTopSelling !== undefined) {
      filter.isTopSelling = String(isTopSelling).toLowerCase() === 'true';
    }

    if (searchTerm && String(searchTerm).trim().length > 0) {
      const term = String(searchTerm).trim();
      andConditions.push({
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
          { category: { $regex: term, $options: 'i' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-asc' || sort === 'price_asc' || sort === 'lowest') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-desc' || sort === 'price_desc' || sort === 'highest') {
      sortOptions = { price: -1 };
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 };
    } else if (sort === 'popular') {
      sortOptions = { reviewsCount: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum) || 1;

    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalProducts: total,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        nextPage: pageNum < totalPages ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null,
      },
      source: 'mongodb_atlas',
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID or slug
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Product ID or slug is required',
      });
    }

    let product = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }

    if (!product) {
      product = await Product.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Product not found with identifier '${id}'.`,
      });
    }

    return res.status(200).json({
      success: true,
      source: 'mongodb_atlas',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products
 * @desc    Create a new product (Admin Only)
 * @access  Private / Admin
 */
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      discount,
      discountPercentage,
      category,
      dressStyle = 'casual',
      colors,
      sizes,
      images,
      stockQuantity,
      stock,
      rating = 4.5,
      isNewArrival = true,
      isTopSelling = false,
    } = req.body;

    const effectiveStock =
      stockQuantity !== undefined ? Number(stockQuantity) : stock !== undefined ? Number(stock) : 0;
    const effectiveDiscount =
      discount !== undefined
        ? Number(discount)
        : discountPercentage !== undefined
          ? Number(discountPercentage)
          : 0;

    const defaultImages =
      Array.isArray(images) && images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'];

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let calcOriginalPrice = originalPrice ? Number(originalPrice) : Number(price);
    if (effectiveDiscount > 0 && (!originalPrice || originalPrice <= price)) {
      calcOriginalPrice = Math.round((Number(price) / (1 - effectiveDiscount / 100)) * 100) / 100;
    }

    const newProduct = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      price: Number(price),
      originalPrice: calcOriginalPrice,
      discount: effectiveDiscount,
      discountPercentage: effectiveDiscount,
      category: category.toLowerCase().trim(),
      dressStyle: dressStyle.toLowerCase(),
      colors: Array.isArray(colors) && colors.length > 0 ? colors : ['#000000'],
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['Small', 'Medium', 'Large'],
      images: defaultImages,
      stockQuantity: effectiveStock,
      stock: effectiveStock,
      rating: Number(rating),
      reviewsCount: 0,
      isNewArrival: Boolean(isNewArrival),
      isTopSelling: Boolean(isTopSelling),
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully in MongoDB Atlas',
      data: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Update an existing product (Admin Only)
 * @access  Private / Admin
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Product ID or slug is required for update.',
      });
    }

    const updateData = { ...req.body };

    if (updateData.stockQuantity !== undefined && updateData.stock === undefined) {
      updateData.stock = Number(updateData.stockQuantity);
    } else if (updateData.stock !== undefined && updateData.stockQuantity === undefined) {
      updateData.stockQuantity = Number(updateData.stock);
    }

    if (updateData.discount !== undefined && updateData.discountPercentage === undefined) {
      updateData.discountPercentage = Number(updateData.discount);
    } else if (updateData.discountPercentage !== undefined && updateData.discount === undefined) {
      updateData.discount = Number(updateData.discountPercentage);
    }

    if (updateData.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    let product = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    }

    if (!product) {
      product = await Product.findOneAndUpdate(
        { slug: id.toLowerCase().trim() },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Product with identifier '${id}' not found for update.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully in MongoDB Atlas',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (Admin Only)
 * @access  Private / Admin
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || id.trim().length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Product ID or slug is required for deletion.',
      });
    }

    let product = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndDelete(id);
    }

    if (!product) {
      product = await Product.findOneAndDelete({ slug: id.toLowerCase().trim() });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Product with identifier '${id}' not found for deletion.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product '${product.name}' deleted successfully from MongoDB Atlas.`,
      deletedId: product._id,
    });
  } catch (error) {
    next(error);
  }
};
