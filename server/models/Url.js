import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema(
  {
    originalUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    shortCode: { type: String, required: true, unique: true, minlength: 3, maxlength: 32 },
    // null for links created by anonymous visitors.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Dashboard listing: newest links of one user.
urlSchema.index({ userId: 1, createdAt: -1 });

export const Url = mongoose.model('Url', urlSchema);
