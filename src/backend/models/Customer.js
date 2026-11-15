import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { signCustomerToken } from '../utils/jwt.js';

const { Schema } = mongoose;

const AddressSchema = new Schema(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'USA' },
  },
  { _id: false }
);

const CustomerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: AddressSchema,
      default: () => ({ street: '', city: '', state: '', postalCode: '', country: 'USA' }),
    },
    role: {
      type: String,
      enum: ['customer'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash password with bcrypt before saving if modified
CustomerSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
CustomerSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate customer JWT token
CustomerSchema.methods.generateAuthToken = function () {
  return signCustomerToken({
    id: this._id.toString(),
    email: this.email,
    name: this.name,
  });
};

export const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
