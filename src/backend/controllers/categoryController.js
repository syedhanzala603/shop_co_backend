import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

/**
 * @route   GET /api/categories
 * @desc    Get all categories and dress styles with live product counts
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const predefinedCategories = ['t-shirts', 'shirts', 'jeans', 'hoodies', 'shorts', 'jackets'];
    const predefinedStyles = ['casual', 'formal', 'party', 'gym'];

    const [categoryDocs, categoryCounts, styleCounts] = await Promise.all([
      Category.find().sort({ displayOrder: 1, name: 1 }),
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Product.aggregate([{ $group: { _id: '$dressStyle', count: { $sum: 1 } } }]),
    ]);

    const countsMap = {};
    categoryCounts.forEach((c) => {
      if (c._id) countsMap[c._id.toLowerCase()] = c.count;
    });

    const allCategorySlugs = Array.from(
      new Set([
        ...categoryDocs.map((c) => c.slug),
        ...Object.keys(countsMap),
        ...predefinedCategories,
      ])
    );

    const categoriesList = allCategorySlugs.map((slug) => {
      const doc = categoryDocs.find((c) => c.slug === slug);
      const name = doc ? doc.name : slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
      return {
        _id: doc?._id || null,
        id: doc?._id || slug,
        slug,
        name,
        displayName: name,
        description: doc?.description || `Explore our latest ${name} collection.`,
        image: doc?.image || '',
        isActive: doc ? doc.isActive : true,
        displayOrder: doc?.displayOrder ?? 0,
        count: countsMap[slug] || 0,
      };
    });

    const stylesMap = {};
    predefinedStyles.forEach((s) => (stylesMap[s] = 0));
    styleCounts.forEach((s) => {
      if (s._id) stylesMap[s._id.toLowerCase()] = s.count;
    });

    return res.status(200).json({
      success: true,
      source: 'mongodb_atlas',
      data: {
        categories: categoriesList,
        dressStyles: Object.entries(stylesMap).map(([name, count]) => ({
          name,
          displayName: name.charAt(0).toUpperCase() + name.slice(1),
          count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ObjectId or slug
 * @access  Public
 */
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let category = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(id);
    }
    if (!category) {
      category = await Category.findOne({ slug: id.toLowerCase().trim() });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Category '${id}' not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      source: 'mongodb_atlas',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/categories
 * @desc    Create a new category (Admin Only)
 * @access  Private / Admin
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description = '', image = '', displayOrder = 0, isActive = true } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Category name is required.',
      });
    }

    const trimmedName = name.trim();
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await Category.findOne({ $or: [{ name: trimmedName }, { slug }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        status: 409,
        message: `Category '${trimmedName}' already exists.`,
      });
    }

    const newCategory = await Category.create({
      name: trimmedName,
      slug,
      description,
      image,
      displayOrder: Number(displayOrder) || 0,
      isActive: Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully in MongoDB Atlas',
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/categories/:id
 * @desc    Update an existing category (Admin Only)
 * @access  Private / Admin
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive, displayOrder } = req.body;

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (displayOrder !== undefined) updateData.displayOrder = Number(displayOrder);

    let category = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    }
    if (!category) {
      category = await Category.findOneAndUpdate(
        { slug: id.toLowerCase().trim() },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Category '${id}' not found for update.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully in MongoDB Atlas',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category (Admin Only)
 * @access  Private / Admin
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    let category = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findByIdAndDelete(id);
    }
    if (!category) {
      category = await Category.findOneAndDelete({ slug: id.toLowerCase().trim() });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Category '${id}' not found for deletion.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Category '${category.name}' deleted successfully from MongoDB Atlas.`,
      deletedId: category._id,
    });
  } catch (error) {
    next(error);
  }
};
