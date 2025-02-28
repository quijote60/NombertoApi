const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const paymentCategorySchema = new mongoose.Schema({
    paymentCategoryID: {
        type: Number,
        unique: true // Enforce uniqueness explicitly
    },
    paymentCategory: {
        type: String,
        required: true,
        unique: true, // Prevent duplicate categories
        trim: true,   // Remove whitespace
        minlength: 2, // Minimum length for meaningful names
        maxlength: 50, // Reasonable upper limit
        index: true   // Improve query performance
    },
    description: { // Optional field
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    }
}, {
    timestamps: true
});

// Apply auto-increment plugin
paymentCategorySchema.plugin(AutoIncrement, {
    id: 'paymentCategory_seq', // Unique sequence name
    inc_field: 'paymentCategoryID',
    start_seq: 1100
});

// Optional: Add error handling for auto-increment
paymentCategorySchema.pre('save', function (next) {
    if (!this.paymentCategoryID) {
        console.error('Auto-increment failed for paymentCategoryID');
    }
    next();
});

module.exports = mongoose.model('PaymentCategory', paymentCategorySchema);