const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const inspectionTypeSchema = new mongoose.Schema(
  {
    inspectionTypeId: {
      type: Number,
      unique: true, // Optional: enforces uniqueness
      index: true,  // Optimizes queries
    },
    inspectionType: { // Renamed for clarity
      type: String,
      required: [true, 'Inspection type is required'],
      unique: true,                  // Ensures no duplicates
      trim: true,                    // Removes whitespace
      minlength: [1, 'Inspection type cannot be empty'],
      maxlength: [100, 'Inspection type cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
  }
);

inspectionTypeSchema.plugin(AutoIncrement, {
  id: 'inspection_type_seq', // More distinct counter ID
  inc_field: 'inspectionTypeId',
  start_seq: 400,
  increment_by: 1, // Explicit for clarity
  collection_name: 'counters', // Explicit collection
});

module.exports = mongoose.model('InspectionType', inspectionTypeSchema);