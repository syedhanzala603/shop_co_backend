import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [150, 'Product name cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters long'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be a positive number'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price must be a positive number'],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be less than 0%'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be less than 0%'],
      max: [100, 'Discount percentage cannot exceed 100%'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock quantity cannot be negative'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    images: {
      type: [String],
      required: [true, 'At least one product image URL is required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0 && val.some((url) => typeof url === 'string' && url.trim().length > 0);
        },
        message: 'Product must have at least one valid image URL',
      },
    },
    colors: {
      type: [String],
      default: ['#000000'],
    },
    sizes: {
      type: [String],
      default: ['Small', 'Medium', 'Large'],
    },
    dressStyle: {
      type: String,
      enum: ['casual', 'formal', 'party', 'gym'],
      default: 'casual',
      index: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: [0, 'Reviews count cannot be negative'],
    },
    isNewArrival: {
      type: Boolean,
      default: true,
      index: true,
    },
    isTopSelling: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: Sync stock & stockQuantity, discount & discountPercentage, and generate slug
ProductSchema.pre('save', function () {
  if (this.stockQuantity !== undefined && this.stock === undefined) {
    this.stock = this.stockQuantity;
  } else if (this.stock !== undefined && (this.stockQuantity === undefined || this.stockQuantity === 0)) {
    this.stockQuantity = this.stock;
  } else if (this.isModified('stockQuantity')) {
    this.stock = this.stockQuantity;
  } else if (this.isModified('stock')) {
    this.stockQuantity = this.stock;
  }

  if (this.discount !== undefined && (this.discountPercentage === undefined || this.discountPercentage === 0)) {
    this.discountPercentage = this.discount;
  } else if (this.discountPercentage !== undefined && (this.discount === undefined || this.discount === 0)) {
    this.discount = this.discountPercentage;
  }

  if (this.discount > 0 && (!this.originalPrice || this.originalPrice <= this.price)) {
    this.originalPrice = Math.round((this.price / (1 - this.discount / 100)) * 100) / 100;
  }

  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
});

export const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
