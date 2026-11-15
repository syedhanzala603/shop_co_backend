import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';

/**
 * @route   POST /api/customer/auth/register
 * @desc    Register a new customer account
 * @access  Public
 */
export const registerCustomer = async (req, res, next) => {
  try {
    const { name, email, password, phone = '', address = {} } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const existingCustomer = await Customer.findOne({ email: normalizedEmail });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        status: 409,
        message: 'An account with this email address is already registered. Please log in.',
      });
    }

    const newCustomer = await Customer.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: String(phone).trim(),
      address: {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postalCode || '',
        country: address.country || 'USA',
      },
      role: 'customer',
      isActive: true,
    });

    const token = newCustomer.generateAuthToken();

    return res.status(201).json({
      success: true,
      message: 'Customer account registered successfully!',
      token,
      tokenType: 'Bearer',
      customer: {
        id: newCustomer._id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        role: 'customer',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/customer/auth/login
 * @desc    Log in customer and return JWT token
 * @access  Public
 */
export const loginCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const customer = await Customer.findOne({ email: normalizedEmail }).select('+password');
    if (!customer) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid credentials: No account found with this email.',
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Invalid credentials: Incorrect password.',
      });
    }

    customer.lastLogin = new Date();
    await customer.save();

    const token = customer.generateAuthToken();

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      tokenType: 'Bearer',
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        role: 'customer',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/customer/profile
 * @desc    Get currently logged in customer profile
 * @access  Private / Customer
 */
export const getCustomerProfile = async (req, res, next) => {
  try {
    const user = req.customerUser;
    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Unauthorized. Please log in.',
      });
    }

    const customer = await Customer.findById(user.id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Customer account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      source: 'mongodb_atlas',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/customer/profile
 * @desc    Update customer profile details or password
 * @access  Private / Customer
 */
export const updateCustomerProfile = async (req, res, next) => {
  try {
    const user = req.customerUser;
    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Unauthorized. Please log in.',
      });
    }

    const { name, phone, address, password } = req.body;

    const customer = await Customer.findById(user.id).select('+password');
    if (!customer) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'Customer account not found.',
      });
    }

    if (name) customer.name = name.trim();
    if (phone !== undefined) customer.phone = phone.trim();
    if (address) {
      customer.address = {
        street: address.street ?? customer.address?.street ?? '',
        city: address.city ?? customer.address?.city ?? '',
        state: address.state ?? customer.address?.state ?? '',
        postalCode: address.postalCode ?? customer.address?.postalCode ?? '',
        country: address.country ?? customer.address?.country ?? 'USA',
      };
    }
    if (password && password.length >= 6) {
      customer.password = password;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully in MongoDB Atlas!',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/customer/orders
 * @desc    Fetch authenticated customer's personal order history
 * @access  Private / Customer
 */
export const getCustomerOrders = async (req, res, next) => {
  try {
    const user = req.customerUser;
    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Unauthorized. Please log in to view order history.',
      });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    const filter = {
      $or: [
        { 'customer.email': user.email.toLowerCase() },
        ...(user.id ? [{ customerId: user.id }] : []),
      ],
    };

    if (status && status !== 'all') {
      filter.status = status;
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
