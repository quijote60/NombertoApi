const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const paymentTypeSchema = new mongoose.Schema(
  {
    paymentTypeId: {
      type: Number,
      unique: true, // Ensures no duplicate IDs (optional, depending on your needs)
      index: true,  // Improves query performance if you search by paymentTypeId
    },
    paymentType: {
      type: String,
      required: true,
      trim: true,    // Removes leading/trailing whitespace
      unique: true,  // Ensures payment types are unique (optional)
      minlength: 1,  // Prevents empty strings
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Apply the auto-increment plugin
paymentTypeSchema.plugin(AutoIncrement, {
  id: 'payment_type_seq',      // Unique identifier for the counter in the 'counters' collection
  inc_field: 'paymentTypeId',  // The field to auto-increment
  start_seq: 600,              // Start the sequence at 600
  increment_by: 1,             // Increment by 1 (default, added for clarity)
  collection_name: 'counters', // Explicitly specify the counters collection (optional)
});

// Export the model
module.exports = mongoose.model('PaymentType', paymentTypeSchema);