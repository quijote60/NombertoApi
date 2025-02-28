const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const residentSchema = new mongoose.Schema(
  {
    residentId: {
      type: Number,
      unique: true,
      index: true,
    },
    firstName: { // Simplified name
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [1, 'First name cannot be empty'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: { // Simplified name
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [1, 'Last name cannot be empty'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: { // Simplified name
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email address'], // Basic email regex
      maxlength: [100, 'Email cannot exceed 100 characters'],
    },
    mobileNumber: { // Simplified name, changed to String
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid mobile number'], // E.164 format or similar
      maxlength: [15, 'Mobile number cannot exceed 15 characters'],
    },
    homeNumber: { // Simplified name, changed to String
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid home number'],
      maxlength: [15, 'Home number cannot exceed 15 characters'],
    },
    notes: { // Simplified name
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
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

// Optional: Index for uniqueness of email if desired
residentSchema.index({ email: 1 }, { unique: true, sparse: true }); // Sparse allows null values

// Apply auto-increment plugin
residentSchema.plugin(AutoIncrement, {
  id: 'resident_seq', // More distinct counter ID
  inc_field: 'residentId',
  start_seq: 800,
  increment_by: 1,
  collection_name: 'counters',
});

module.exports = mongoose.model('Resident', residentSchema);