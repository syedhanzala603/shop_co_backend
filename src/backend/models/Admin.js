import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '../utils/jwt.js';

const { Schema } = mongoose;

const AdminSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Admin password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
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

// Hash password securely with bcrypt before saving
AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password against stored bcrypt hash
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate secure JWT token containing only admin id & email
AdminSchema.methods.generateAuthToken = function () {
  return signAdminToken({
    id: this._id.toString(),
    email: this.email,
  });
};

export const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
