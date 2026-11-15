import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Category } from '../models/Category.js';
import { initialCategories, initialProducts, initialOrders } from '../utils/seedData.js';

/**
 * @route   POST /api/seed
 * @desc    Seed Shop-Co categories, products, and initial orders into MongoDB Atlas
 * @access  Public
 */
export const seedDatabase = async (req, res, next) => {
  try {
    const existingCount = await Product.countDocuments();
    if (existingCount > 0 && req.body?.force !== true) {
      return res.status(200).json({
        success: true,
        message: `Database already contains ${existingCount} products. Pass { "force": true } to replace them.`,
        count: existingCount,
      });
    }

    if (req.body?.force === true) {
      await Promise.all([
        Category.deleteMany({}),
        Product.deleteMany({}),
        Order.deleteMany({}),
      ]);
    }

    const existingCategoriesCount = await Category.countDocuments();
    let createdCategories = [];
    if (existingCategoriesCount === 0) {
      createdCategories = await Category.insertMany(initialCategories);
    }

    const createdProducts = await Product.insertMany(initialProducts);
    const createdOrders = await Order.insertMany(initialOrders);

    return res.status(201).json({
      success: true,
      message: 'MongoDB Atlas successfully populated with Shop-Co catalog!',
      seededCategories: createdCategories.length,
      seededProducts: createdProducts.length,
      seededOrders: createdOrders.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/seed/reset
 * @desc    Wipe and re-seed database collections in MongoDB Atlas
 * @access  Public
 */
export const resetDatabase = async (req, res, next) => {
  try {
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
    ]);

    const createdCategories = await Category.insertMany(initialCategories);
    const createdProducts = await Product.insertMany(initialProducts);
    const createdOrders = await Order.insertMany(initialOrders);

    return res.status(200).json({
      success: true,
      message: 'MongoDB Atlas reset and re-seeded with fresh Shop-Co catalog.',
      seededCategories: createdCategories.length,
      seededProducts: createdProducts.length,
      seededOrders: createdOrders.length,
    });
  } catch (error) {
    next(error);
  }
};
