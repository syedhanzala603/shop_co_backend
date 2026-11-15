import { Order } from '../models/Order.js';

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filtering, search & pagination (Used by Admin Dashboard)
 * @access  Private / Admin
 */
export const getOrders = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Order.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalOrders: total,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      source: 'mongodb_atlas',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by ID or orderNumber
 * @access  Public / Admin
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Order '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      source: 'mongodb_atlas',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/orders
 * @desc    Create a new order (Used by Customer Shopping Website Checkout)
 * @access  Public (Attaches customerId if authenticated customer JWT is provided)
 */
export const createOrder = async (req, res, next) => {
  try {
    const { customer, items, paymentMethod = 'credit_card', notes } = req.body;

    if (!customer || !customer.name || !customer.email || !customer.address) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Customer name, email, and shipping address are required.',
      });
    }

    if (!customer.address.street || !customer.address.city) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Shipping address street and city are required.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: 'Order items must be a non-empty array.',
      });
    }

    for (const item of items) {
      if (!item.name || item.price === undefined || Number(item.price) < 0 || !item.quantity || Number(item.quantity) < 1) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: 'Each order item must include a valid name, price, and quantity (>= 1).',
        });
      }
    }

    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    const discount = Number(req.body.discount) || 0;
    const deliveryFee = subtotal > 200 ? 0 : (Number(req.body.deliveryFee) ?? 15);
    const totalAmount = Math.max(0, subtotal - discount + deliveryFee);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${new Date().getFullYear()}-${randomSuffix}`;

    const orderPayload = {
      orderNumber,
      customer: {
        name: String(customer.name).trim(),
        email: String(customer.email).trim().toLowerCase(),
        phone: customer.phone ? String(customer.phone).trim() : '',
        address: {
          street: String(customer.address.street).trim(),
          city: String(customer.address.city).trim(),
          state: customer.address.state || '',
          postalCode: customer.address.postalCode || '',
          country: customer.address.country || 'USA',
        },
      },
      items,
      subtotal,
      discount,
      deliveryFee,
      totalAmount,
      status: 'pending',
      paymentMethod,
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'paid',
      notes,
    };

    if (req.customerUser?.id) {
      orderPayload.customerId = req.customerUser.id;
    }

    const order = await Order.create(orderPayload);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully in MongoDB Atlas',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (Used by Admin Dashboard)
 * @access  Private / Admin
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: `Invalid paymentStatus '${paymentStatus}'. Must be one of: ${validPaymentStatuses.join(', ')}`,
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }
    if (!order) {
      order = await Order.findOneAndUpdate({ orderNumber: id }, updateData, { new: true, runValidators: true });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Order '${id}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${order.status}' in MongoDB Atlas`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/orders/:id
 * @desc    Update order details (Admin Only)
 * @access  Private / Admin
 */
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    }
    if (!order) {
      order = await Order.findOneAndUpdate({ orderNumber: id }, req.body, { new: true, runValidators: true });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Order '${id}' not found for update`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully in MongoDB Atlas',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete or cancel order (Admin Only)
 * @access  Private / Admin
 */
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    let order = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findByIdAndDelete(id);
    }
    if (!order) {
      order = await Order.findOneAndDelete({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `Order '${id}' not found for deletion`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Order '${order.orderNumber}' deleted successfully from MongoDB Atlas`,
      deletedId: order._id,
    });
  } catch (error) {
    next(error);
  }
};
