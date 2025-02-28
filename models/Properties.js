const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const propertySchema = new mongoose.Schema(
  {
    propertyId: {
      type: Number,
      unique: true, // Optional: enforces uniqueness at DB level
      index: true,  // Improves query performance for propertyId lookups
    },
    name: {
      type: String,
      required: [true, 'Property name is required'],
      unique: true,
      trim: true,            // Removes leading/trailing whitespace
      minlength: [1, 'Property name cannot be empty'],
      maxlength: [100, 'Property name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      unique: true,
      trim: true,
      minlength: [1, 'Address cannot be empty'],
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      minlength: [1, 'City cannot be empty'],
      maxlength: [100, 'City cannot exceed 100 characters'],
      index: true, // Optional: index if frequently queried
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      uppercase: true,       // Forces state codes to uppercase (e.g., "CA")
      minlength: [2, 'State must be exactly 2 characters'],
      maxlength: [2, 'State must be exactly 2 characters'],
      // Optional: Add enum for US states if applicable
      // enum: ['AL', 'AK', 'AZ', ...]
    },
    zipcode: {
      type: Number,
      min: [0, 'Zipcode cannot be negative'],
      max: [99999, 'Zipcode cannot exceed 99999'], // US 5-digit zipcode
      // Consider making required if always needed
    },
    unitCount: {
      type: Number,
      min: [0, 'Unit count cannot be negative'],
      // Consider adding required or default if it’s critical
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Apply the auto-increment plugin
propertySchema.plugin(AutoIncrement, {
  id: 'property_seq',      // Unique identifier for the counter in the 'counters' collection
  inc_field: 'propertyId', // The field to auto-increment
  start_seq: 700,          // Start the sequence at 700
  increment_by: 1,         // Increment by 1 (default, added for clarity)
  collection_name: 'counters', // Explicitly specify the counters collection
});

// Export the model
module.exports = mongoose.model('Property', propertySchema);




