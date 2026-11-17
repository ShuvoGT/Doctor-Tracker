import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true, index: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
  },
  { timestamps: true }
);

// Text index powers fast full-text search across the key doctor fields.
doctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text', email: 'text' });
// Supports the default "newest first" sort + date range filtering.
doctorSchema.index({ createdAt: -1 });

// Expose a virtual patient count populated via aggregation when needed.
doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

export default mongoose.model('Doctor', doctorSchema);
