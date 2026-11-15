import mongoose from 'mongoose';

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    productId: {
      type: Schema.Types.Mixed,
      required: [true, 'Product ID is required'],
      index: true,
    },
    userName: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
    },
    verified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
