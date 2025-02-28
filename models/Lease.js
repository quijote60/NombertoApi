const mongoose = require('mongoose');

const leaseSchema = new mongoose.Schema(
  {
    leaseId: {
      type: String,
      required: [true, 'Lease ID is required'],
      unique: true,
      trim: true,
      minlength: [1, 'Lease ID cannot be empty'],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Property ID is required'],
      ref: 'Property',
      index: true,
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Unit ID is required'],
      ref: 'Unit',
    },
    leaseDate: {
      type: Date,
      required: [true, 'Lease date is required'],
      validate: {
        validator: (date) => date <= new Date(),
        message: 'Lease date cannot be in the future',
      },
    },
    leaseStartDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.leaseEndDate || !value || value <= this.leaseEndDate;
        },
        message: 'Lease start date must be on or before lease end date',
      },
    },
    leaseEndDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.leaseStartDate || !value || value >= this.leaseStartDate;
        },
        message: 'Lease end date must be on or after lease start date',
      },
    },
    leaseTerm: {
      type: Number,
      min: [0, 'Lease term cannot be negative'],
    },
    monthlyRent: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: [0, 'Monthly rent cannot be negative'],
    },
    securityDeposit: {
      type: Number,
      min: [0, 'Security deposit cannot be negative'],
    },
    active: {
      type: Boolean,
      default: true,
      required: [true, 'Active status is required'],
    },
  },
  {
    timestamps: true,
  }
);

leaseSchema.pre('save', async function (next) {
  try {
    const [property, unit] = await Promise.all([
      mongoose.model('Property').exists({ _id: this.propertyId }),
      mongoose.model('Unit').exists({ _id: this.unitId }),
    ]);

    if (!property) return next(new Error('Referenced Property does not exist'));
    if (!unit) return next(new Error('Referenced Unit does not exist'));

    // Ensure leaseId is not null or undefined
    if (!this.leaseId) {
      return next(new Error('Lease ID cannot be null or undefined'));
    }

    next();
  } catch (error) {
    next(error);
  }
});

leaseSchema.index({ propertyId: 1, leaseDate: -1 });

module.exports = mongoose.model('Lease', leaseSchema);