const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const utilityTypeSchema = new mongoose.Schema(
  {
    utilityTypeId: { // Explicitly defined
      type: Number,
      unique: true,
      index: true,
    },
    utilityName: { // Renamed for clarity
      type: String,
      required: [true, 'Utility name is required'],
      trim: true,
      minlength: [1, 'Utility name cannot be empty'],
      maxlength: [100, 'Utility name cannot exceed 100 characters'],
    },
    utilityProvider: {
      type: String,
      required: [true, 'Utility provider is required'],
      trim: true,
      minlength: [1, 'Utility provider cannot be empty'],
      maxlength: [100, 'Utility provider cannot exceed 100 characters'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure uniqueness of utilityName and utilityProvider combination
utilityTypeSchema.index({ utilityName: 1, utilityProvider: 1 }, { unique: true });

utilityTypeSchema.plugin(AutoIncrement, {
  id: 'utility_type_seq', // More distinct counter ID
  inc_field: 'utilityTypeId',
  start_seq: 1000,
  increment_by: 1,
  collection_name: 'counters',
});

module.exports = mongoose.model('UtilityType', utilityTypeSchema); // Singular name