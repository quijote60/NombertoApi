const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const expenseSchema = new mongoose.Schema(
  {
    expenseId: {
      type: Number,
      unique: true, // Optional: enforces uniqueness at DB level
      index: true,  // Improves query performance for expenseId lookups
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Property ID is required'],
      ref: 'Property', // Adjusted to singular 'Property' (verify model name)
      index: true,     // Optimize queries by propertyId
    },
    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required'],
      validate: {
        validator: (date) => date <= new Date(), // Ensures date isn’t in the future
        message: 'Expense date cannot be in the future',
      },
    },
    notes: {
      type: String,
      trim: true,                    // Removes leading/trailing whitespace
      maxlength: [500, 'Notes cannot exceed 500 characters'], // Optional limit
    },
    expenseAmount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Expense amount cannot be negative'],
      // Consider adding max if there’s a reasonable upper limit
    },
    paymentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Payment category is required'],
      ref: 'PaymentCategory', // Verify model name
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Payment type is required'],
      ref: 'PaymentType', // Verify model name
    },
    checkNumber: {
      type: Number,
      min: [0, 'Check number cannot be negative'],
      // Consider making required if check numbers are mandatory
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Apply the auto-increment plugin
expenseSchema.plugin(AutoIncrement, {
  id: 'expense_seq',      // Unique identifier for the counter in the 'counters' collection
  inc_field: 'expenseId', // The field to auto-increment
  start_seq: 1,           // Start the sequence at 1
  increment_by: 1,        // Increment by 1 (default, added for clarity)
  collection_name: 'counters', // Explicitly specify the counters collection
});

expenseSchema.pre('save', async function (next) {
    const [property, category, type] = await Promise.all([
      mongoose.model('Property').exists({ _id: this.propertyId }),
      mongoose.model('PaymentCategory').exists({ _id: this.paymentCategory }),
      mongoose.model('PaymentType').exists({ _id: this.paymentType }),
    ]);
    if (!property || !category || !type) {
      return next(new Error('Invalid reference to property, category, or type'));
    }
    next();
  });

// Export the model
module.exports = mongoose.model('Expense', expenseSchema);