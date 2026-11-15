/**
 * Validates customer registration payload
 */
export const validateCustomerRegister = (req, res, next) => {
  const errors = [];
  const { name, email, password, phone, address } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Full name is required.' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long.' });
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name cannot exceed 100 characters.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email address is required.' });
  } else if (!emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address (e.g. user@example.com).' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required.' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long.' });
  }

  if (phone !== undefined && typeof phone !== 'string') {
    errors.push({ field: 'phone', message: 'Phone number must be a string.' });
  }

  if (address !== undefined && typeof address !== 'object') {
    errors.push({ field: 'address', message: 'Address must be an object with street, city, and country.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Validation failed: Please correct the registration fields.',
      errors,
    });
  }

  next();
};

/**
 * Validates customer login payload
 */
export const validateCustomerLogin = (req, res, next) => {
  const errors = [];
  const { email, password } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email is required.' });
  } else if (!emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please provide a valid email address.' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Validation failed: Email and password are required.',
      errors,
    });
  }

  next();
};

/**
 * Validates customer profile update payload
 */
export const validateCustomerProfileUpdate = (req, res, next) => {
  const errors = [];
  const { name, phone, address, password } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters long.' });
    }
  }

  if (phone !== undefined && typeof phone !== 'string') {
    errors.push({ field: 'phone', message: 'Phone must be a string.' });
  }

  if (password !== undefined) {
    if (typeof password !== 'string' || password.length < 6) {
      errors.push({ field: 'password', message: 'New password must be at least 6 characters long.' });
    }
  }

  if (address !== undefined && typeof address !== 'object') {
    errors.push({ field: 'address', message: 'Address must be an object.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Validation failed for profile update.',
      errors,
    });
  }

  next();
};
