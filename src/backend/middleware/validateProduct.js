/**
 * Middleware: Validates product payload for POST /api/products (Creation)
 */
export const validateCreateProduct = (req, res, next) => {
  const errors = [];
  const {
    name,
    description,
    price,
    category,
    stockQuantity,
    stock,
    images,
    discount,
    discountPercentage,
    dressStyle,
    colors,
    sizes,
  } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Product name is required and must be a non-empty string.' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Product name must be at least 2 characters long.' });
  } else if (name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Product name cannot exceed 150 characters.' });
  }

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Product description is required.' });
  } else if (description.trim().length < 5) {
    errors.push({ field: 'description', message: 'Product description must be at least 5 characters long.' });
  }

  if (price === undefined || price === null || price === '') {
    errors.push({ field: 'price', message: 'Product price is required.' });
  } else if (typeof price !== 'number' && isNaN(Number(price))) {
    errors.push({ field: 'price', message: 'Product price must be a valid number.' });
  } else if (Number(price) < 0) {
    errors.push({ field: 'price', message: 'Product price must be greater than or equal to 0.' });
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push({ field: 'category', message: 'Product category is required (e.g. "t-shirts", "jeans", "shirts").' });
  }

  const effectiveStock = stockQuantity !== undefined ? stockQuantity : stock;
  if (effectiveStock === undefined || effectiveStock === null || effectiveStock === '') {
    errors.push({ field: 'stockQuantity', message: 'Stock quantity is required.' });
  } else if (typeof effectiveStock !== 'number' && isNaN(Number(effectiveStock))) {
    errors.push({ field: 'stockQuantity', message: 'Stock quantity must be a valid number.' });
  } else if (Number(effectiveStock) < 0 || !Number.isInteger(Number(effectiveStock))) {
    errors.push({ field: 'stockQuantity', message: 'Stock quantity must be a non-negative whole integer.' });
  }

  if (!images) {
    errors.push({ field: 'images', message: 'At least one product image URL is required.' });
  } else if (!Array.isArray(images) || images.length === 0) {
    errors.push({ field: 'images', message: 'Images must be a non-empty array of URL strings.' });
  } else {
    const hasValidImage = images.some((img) => typeof img === 'string' && img.trim().length > 0);
    if (!hasValidImage) {
      errors.push({ field: 'images', message: 'Images array must contain at least one valid string URL.' });
    }
  }

  const effectiveDiscount = discount !== undefined ? discount : discountPercentage;
  if (effectiveDiscount !== undefined && effectiveDiscount !== null && effectiveDiscount !== '') {
    if (isNaN(Number(effectiveDiscount)) || Number(effectiveDiscount) < 0 || Number(effectiveDiscount) > 100) {
      errors.push({ field: 'discount', message: 'Discount must be a number between 0% and 100%.' });
    }
  }

  if (dressStyle && !['casual', 'formal', 'party', 'gym'].includes(String(dressStyle).toLowerCase())) {
    errors.push({
      field: 'dressStyle',
      message: 'Dress style must be one of: "casual", "formal", "party", "gym".',
    });
  }

  if (colors !== undefined && !Array.isArray(colors)) {
    errors.push({ field: 'colors', message: 'Colors must be an array of color strings or hex codes.' });
  }

  if (sizes !== undefined && !Array.isArray(sizes)) {
    errors.push({ field: 'sizes', message: 'Sizes must be an array of size strings (e.g. ["Small", "Medium", "Large"]).' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Validation failed: Please check the required product fields.',
      errors,
    });
  }

  next();
};

/**
 * Middleware: Validates product payload for PUT /api/products/:id (Update)
 */
export const validateUpdateProduct = (req, res, next) => {
  const errors = [];
  const {
    name,
    description,
    price,
    category,
    stockQuantity,
    stock,
    images,
    discount,
    discountPercentage,
    dressStyle,
  } = req.body;

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Update failed: Request body cannot be empty.',
    });
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Product name must be a string with at least 2 characters.' });
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length < 5) {
      errors.push({ field: 'description', message: 'Product description must be at least 5 characters long.' });
    }
  }

  if (price !== undefined) {
    if (typeof price !== 'number' && isNaN(Number(price))) {
      errors.push({ field: 'price', message: 'Price must be a valid number.' });
    } else if (Number(price) < 0) {
      errors.push({ field: 'price', message: 'Price must be greater than or equal to 0.' });
    }
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || category.trim().length === 0) {
      errors.push({ field: 'category', message: 'Category cannot be empty.' });
    }
  }

  const effectiveStock = stockQuantity !== undefined ? stockQuantity : stock;
  if (effectiveStock !== undefined) {
    if (isNaN(Number(effectiveStock)) || Number(effectiveStock) < 0) {
      errors.push({ field: 'stockQuantity', message: 'Stock quantity must be a non-negative number.' });
    }
  }

  if (images !== undefined) {
    if (!Array.isArray(images) || images.length === 0) {
      errors.push({ field: 'images', message: 'Images must be a non-empty array of URL strings.' });
    }
  }

  const effectiveDiscount = discount !== undefined ? discount : discountPercentage;
  if (effectiveDiscount !== undefined) {
    if (isNaN(Number(effectiveDiscount)) || Number(effectiveDiscount) < 0 || Number(effectiveDiscount) > 100) {
      errors.push({ field: 'discount', message: 'Discount must be between 0% and 100%.' });
    }
  }

  if (dressStyle !== undefined && !['casual', 'formal', 'party', 'gym'].includes(String(dressStyle).toLowerCase())) {
    errors.push({
      field: 'dressStyle',
      message: 'Dress style must be one of: "casual", "formal", "party", "gym".',
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Validation failed for update fields.',
      errors,
    });
  }

  next();
};
