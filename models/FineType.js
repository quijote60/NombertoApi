const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const fineTypeSchema = new mongoose.Schema(
  {
    fineTypeId: {
      type: Number,
      unique: true, // Optional: enforces uniqueness at DB level
      index: true,  // Improves query performance for fineTypeId lookups
    },
    fineType: {
      type: String,
      required: [true, 'Fine type is required'],
      unique: true,                  // Ensures no duplicate fine types
      trim: true,                    // Removes leading/trailing whitespace
      minlength: [1, 'Fine type cannot be empty'],
      maxlength: [100, 'Fine type cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Apply the auto-increment plugin
fineTypeSchema.plugin(AutoIncrement, {
  id: 'fine_type_seq',    // Unique identifier for the counter in the 'counters' collection
  inc_field: 'fineTypeId', // The field to auto-increment
  start_seq: 200,          // Start the sequence at 200
  increment_by: 1,         // Increment by 1 (default, added for clarity)
  collection_name: 'counters', // Explicitly specify the counters collection
});

// Export the model
module.exports = mongoose.model('FineType', fineTypeSchema);