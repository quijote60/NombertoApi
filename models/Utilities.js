const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const utilitySchema = new mongoose.Schema(
  {
    utilityId: {
      type: Number,
      unique: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Property ID is required'],
      ref: 'Property', // Assuming singular model name; verify
      index: true,
    },
    utilityTypeId: { // Renamed for clarity
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Utility type ID is required'],
      ref: 'UtilityType', // Assuming singular; verify
    },
    readingDate: {
      type: Date,
      validate: {
        validator: (date) => !date || date <= new Date(),
        message: 'Reading date cannot be in the future',
      },
    },
    meterReading: {
      type: Number,
      min: [0, 'Meter reading cannot be negative'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      validate: {
        validator: (date) => date <= new Date(),
        message: 'Payment date cannot be in the future',
      },
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Payment type is required'],
      ref: 'PaymentType',
    },
    paymentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Payment category is required'],
      ref: 'PaymentCategory',
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

// Pre-save hook for reference validation
utilitySchema.pre('save', async function (next) {
  try {
    const [property, utilityType, paymentType, paymentCategory] = await Promise.all([
      mongoose.model('Property').exists({ _id: this.propertyId }),
      mongoose.model('UtilityType').exists({ _id: this.utilityTypeId }),
      mongoose.model('PaymentType').exists({ _id: this.paymentType }),
      mongoose.model('PaymentCategory').exists({ _id: this.paymentCategory }),
    ]);

    if (!property) return next(new Error('Referenced Property does not exist'));
    if (!utilityType) return next(new Error('Referenced UtilityType does not exist'));
    if (!paymentType) return next(new Error('Referenced PaymentType does not exist'));
    if (!paymentCategory) return next(new Error('Referenced PaymentCategory does not exist'));

    if (this.readingDate && this.paymentDate && this.readingDate > this.paymentDate) {
      return next(new Error('Reading date cannot be after payment date'));
    }

    next();
  } catch (error) {
    next(error);
  }
});

utilitySchema.plugin(AutoIncrement, {
  id: 'utility_seq',
  inc_field: 'utilityId',
  start_seq: 900,
  increment_by: 1,
  collection_name: 'counters',
});

utilitySchema.index({ propertyId: 1, paymentDate: -1 });

module.exports = mongoose.model('Utility', utilitySchema);