const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
  {
    unitNumber: { // Renamed for clarity
      type: String,
      required: [true, 'Unit number is required'],
      trim: true,
      minlength: [1, 'Unit number cannot be empty'],
      maxlength: [50, 'Unit number cannot exceed 50 characters']
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Property ID is required'],
      ref: 'Property', // Adjusted to singular (verify model name)
      index: true,
    },
    bedrooms: {
      type: Number,
      min: [0, 'Bedrooms cannot be negative'],
      max: [20, 'Bedrooms cannot exceed 20'], // Reasonable upper limit
    },
    bathrooms: {
      type: Number,
      min: [0, 'Bathrooms cannot be negative'],
      max: [20, 'Bathrooms cannot exceed 20'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    rented: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness of unitNumber within a property
unitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });

// Pre-save hook for reference validation
unitSchema.pre('save', async function (next) {
  try {
    const property = await mongoose.model('Property').exists({ _id: this.propertyId });
    if (!property) {
      return next(new Error('Referenced Property does not exist'));
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Unit', unitSchema);

