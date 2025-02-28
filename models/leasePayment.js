const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Lease = require('../models/Lease');

const leasePaymentSchema = new mongoose.Schema(
  {
    leasePaymentId: {
      type: Number,
      unique: true,
      index: true,
    },
    leaseId: {
      type: String,
      required: [true, 'Lease ID is required'],
      ref: 'Lease',
      trim: true,
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
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      validate: {
        validator: (date) => date <= new Date(),
        message: 'Payment date cannot be in the future',
      },
    },
    monthlyRent: {
      type: Number,
      required: false,
    },
    paymentAmount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Payment amount cannot be negative'],
    },
    balance: {
      type: Number,
      required: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    paymentDueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value >= this.paymentDate;
        },
        message: 'Payment due date must be on or after payment date',
      },
    },
    totalPaid: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

leasePaymentSchema.plugin(AutoIncrement, {
  id: 'lease_payment_seq',
  inc_field: 'leasePaymentId',
  start_seq: 500,
  increment_by: 1,
  collection_name: 'counters',
});

// Updated pre-save hook
leasePaymentSchema.pre('validate', async function (next) {
  try {
    const LeasePayment = mongoose.model('LeasePayment');

    // Fetch lease by leaseId (String) instead of _id
    const lease = await Lease.findOne({ leaseId: this.leaseId }).lean().exec();
    if (!lease) {
      return next(new Error(`Lease with ID ${this.leaseId} not found`));
    }

    // Validate paymentType and paymentCategory
    const [paymentType, paymentCategory] = await Promise.all([
      mongoose.model('PaymentType').exists({ _id: this.paymentType }),
      mongoose.model('PaymentCategory').exists({ _id: this.paymentCategory }),
    ]);
    if (!paymentType) return next(new Error('Referenced PaymentType does not exist'));
    if (!paymentCategory) return next(new Error('Referenced PaymentCategory does not exist'));

    // Set monthlyRent from lease
    this.monthlyRent = lease.monthlyRent;

    // Get all previous payments for this leaseId
    const previousPayments = await LeasePayment.find({ leaseId: this.leaseId }).lean().exec();

    // Calculate totalPaid across all payments
    const totalPaidSoFar = previousPayments.reduce((sum, payment) => sum + payment.paymentAmount, 0);

    // Use leaseStartDate or fallback to leaseDate
    const leaseStart = lease.leaseStartDate || lease.leaseDate;
    if (!leaseStart) {
      return next(new Error('Lease must have a start date or lease date for balance calculation'));
    }

    const today = new Date();
    const monthsElapsed = Math.max(
      1,
      (today.getFullYear() - leaseStart.getFullYear()) * 12 + (today.getMonth() - leaseStart.getMonth())
    );
    const expectedTotalRent = monthsElapsed * lease.monthlyRent;

    // Calculate balance and totalPaid
    this.balance = expectedTotalRent - (totalPaidSoFar + this.paymentAmount);
    this.totalPaid = totalPaidSoFar + this.paymentAmount;

    next();
  } catch (error) {
    return next(error);
  }
});

// Post-delete hook (unchanged)
leasePaymentSchema.post('findOneAndDelete', async function (doc) {
  try {
    if (!doc) return;

    const LeasePayment = mongoose.model('LeasePayment');
    const lease = await Lease.findOne({ leaseId: doc.leaseId }).lean().exec();
    if (!lease) {
      console.warn(`Lease ${doc.leaseId} not found during post-delete recalculation`);
      return;
    }

    const remainingPayments = await LeasePayment.find({ leaseId: doc.leaseId }).sort({ paymentDate: 1 });
    if (!remainingPayments.length) return;

    const leaseStart = lease.leaseStartDate || lease.leaseDate;
    const today = new Date();
    const monthsElapsed = Math.max(
      1,
      (today.getFullYear() - leaseStart.getFullYear()) * 12 + (today.getMonth() - leaseStart.getMonth())
    );
    const expectedTotalRent = monthsElapsed * lease.monthlyRent;

    let runningTotalPaid = 0;
    for (const payment of remainingPayments) {
      runningTotalPaid += payment.paymentAmount;
      payment.totalPaid = runningTotalPaid;
      payment.monthlyRent = lease.monthlyRent;
      payment.balance = expectedTotalRent - runningTotalPaid;
      await payment.save({ validateBeforeSave: false });
    }
  } catch (error) {
    console.error(`Error recalculating LeasePayment after deletion: ${error.message}`);
  }
});

leasePaymentSchema.index({ leaseId: 1, paymentDate: -1 });

module.exports = mongoose.model('LeasePayment', leasePaymentSchema);