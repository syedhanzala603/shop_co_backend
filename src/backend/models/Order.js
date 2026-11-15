import mongoose from 'mongoose';

const { Schema } = mongoose;

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.Mixed,
      ref: 'Product',
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: 'Medium' },
    color: { type: String, default: '#000000' },
    image: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.Mixed,
      ref: 'Customer',
      index: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
      phone: { type: String, trim: true },
      address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, required: true, default: 'USA' },
      },
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order must contain at least one item'],
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 15 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'stripe', 'cash_on_delivery', 'paypal'],
      default: 'credit_card',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
