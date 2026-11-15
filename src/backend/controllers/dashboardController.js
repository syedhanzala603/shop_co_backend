import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Category } from '../models/Category.js';
import { Customer } from '../models/Customer.js';
import { getDBStatus } from '../config/db.js';

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get comprehensive metrics and analytics for Admin Dashboard
 * @access  Private / Admin
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [productsCount, categoriesCount, registeredCustomersCount, orders, lowStockProducts] =
      await Promise.all([
        Product.countDocuments(),
        Category.countDocuments(),
        Customer.countDocuments(),
        Order.find().sort({ createdAt: -1 }),
        Product.find({ $or: [{ stockQuantity: { $lte: 10 } }, { stock: { $lte: 10 } }] }).select(
          'name price stock stockQuantity category images slug'
        ),
      ]);

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const uniqueOrderCustomers = new Set(orders.map((o) => o.customer?.email?.toLowerCase())).size;
    const totalCustomers = Math.max(registeredCustomersCount, uniqueOrderCustomers);

    const statusCounts = {
      pending: orders.filter((o) => o.status === 'pending').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipped: orders.filter((o) => o.status === 'shipped').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };

    const averageOrderValue =
      orders.length > 0 ? Math.round((totalRevenue / orders.length) * 100) / 100 : 0;

    const categorySalesMap = {};
    orders.forEach((ord) => {
      if (ord.items) {
        ord.items.forEach((item) => {
          const cat = item.category || 'general';
          if (!categorySalesMap[cat]) categorySalesMap[cat] = { count: 0, revenue: 0 };
          categorySalesMap[cat].count += item.quantity || 1;
          categorySalesMap[cat].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    return res.status(200).json({
      success: true,
      source: 'mongodb_atlas',
      data: {
        metrics: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders: orders.length,
          totalProducts: productsCount,
          totalCategories: categoriesCount,
          totalCustomers,
          averageOrderValue,
          lowStockCount: lowStockProducts.length,
          statusCounts,
        },
        recentOrders: orders.slice(0, 8),
        lowStockProducts: lowStockProducts.slice(0, 6),
        categorySales: Object.entries(categorySalesMap).map(([category, stats]) => ({
          category,
          itemsSold: stats.count,
          revenue: Math.round(stats.revenue * 100) / 100,
        })),
        database: getDBStatus(),
      },
    });
  } catch (error) {
    next(error);
  }
};
