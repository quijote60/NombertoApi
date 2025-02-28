const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const inspectionSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: Number,
      unique: true, // Optional: enforces uniqueness
      index: true,  // Optimizes queries
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Property ID is required'],
      ref: 'Property', // Adjusted to singular (verify model name)
      index: true,     // Optimizes queries
    },
    inspectionTypeId: { // Renamed for clarity
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Inspection type is required'],
      ref: 'InspectionType',
    },
    inspectionDate: {
      type: Date,
      required: [true, 'Inspection date is required'],
      validate: {
        validator: (date) => date <= new Date(),
        message: 'Inspection date cannot be in the future',
      },
    },
    inspectedBy: {
      type: String,
      required: [true, 'Inspected by is required'],
      trim: true,
      minlength: [1, 'Inspected by cannot be empty'],
      maxlength: [100, 'Inspected by cannot exceed 100 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    inspectionAmount: {
      type: Number,
      required: [true, 'Inspection amount is required'],
      min: [0, 'Inspection amount cannot be negative'],
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Payment type is required'],
      ref: 'PaymentType',
    },
    checkNumber: {
      type: Number,
      min: [0, 'Check number cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);
inspectionSchema.pre('save', async function (next) {
    try {
      // Check if referenced documents exist
      const [property, inspectionType, paymentType] = await Promise.all([
        mongoose.model('Property').exists({ _id: this.propertyId }),
        mongoose.model('InspectionType').exists({ _id: this.inspectionTypeId }),
        mongoose.model('PaymentType').exists({ _id: this.paymentType }),
      ]);
  
      if (!property) {
        return next(new Error('Referenced Property does not exist'));
      }
      if (!inspectionType) {
        return next(new Error('Referenced InspectionType does not exist'));
      }
      if (!paymentType) {
        return next(new Error('Referenced PaymentType does not exist'));
      }
  
      next(); // Proceed with save if all references are valid
    } catch (error) {
      next(error); // Pass any errors to Mongoose
    }
  });
inspectionSchema.plugin(AutoIncrement, {
  id: 'inspection_seq', // Distinct counter ID
  inc_field: 'inspectionId',
  start_seq: 300,
  increment_by: 1,
  collection_name: 'counters',
});

// Optional compound index for common queries
inspectionSchema.index({ propertyId: 1, inspectionDate: -1 });

module.exports = mongoose.model('Inspection', inspectionSchema);