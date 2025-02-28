const mongoose = require('mongoose')



const fineSchema = new mongoose.Schema(
    {
        fineId: {
            type: String,
            required: [true, 'Fine ID is required'],
            unique: true,                  // Ensures uniqueness
            trim: true,                    // Removes whitespace
            match: [/^[A-Za-z0-9-]+$/, 'Fine ID can only contain letters, numbers, and hyphens'], // Example format
            index: true,                   // Optimizes queries
          },
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Property ID is required'],
            ref: 'Property',               // Adjusted to singular (verify model name)
            index: true,                   // Optimizes queries by propertyId
          },
          fineType: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Fine type is required'],
            ref: 'FineType',
          },
          fineDate: {
            type: Date,
            required: [true, 'Fine date is required'],
            validate: {
              validator: (date) => date <= new Date(), // Prevents future dates
              message: 'Fine date cannot be in the future',
            },
          },
          fineDueDate: {
            type: Date,
            required: [true, 'Fine due date is required'],
            validate: {
              validator: function (date) {
                return date >= this.fineDate;        // Ensures due date is after fine date
              },
              message: 'Fine due date must be on or after the fine date',
            },
          },
          notes: {
            type: String,
            trim: true,                    // Removes whitespace
            maxlength: [500, 'Notes cannot exceed 500 characters'], // Optional limit
          },
          fineAmount: {
            type: Number,
            required: [true, 'Fine amount is required'],
            min: [0, 'Fine amount cannot be negative'],
          },
          paymentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Payment category is required'],
            ref: 'PaymentCategory',        // Verify model name
          },
          paymentType: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Payment type is required'],
            ref: 'PaymentType',
          },
          checkNumber: {
            type: Number,
            min: [0, 'Check number cannot be negative'],
            // Consider making required if mandatory
          },
        },
        {
          timestamps: true, // Adds createdAt and updatedAt
        }
      );
      fineSchema.pre('save', async function (next) {
        const [property, fineType, category, type] = await Promise.all([
          mongoose.model('Property').exists({ _id: this.propertyId }),
          mongoose.model('FineType').exists({ _id: this.fineType }),
          mongoose.model('PaymentCategory').exists({ _id: this.paymentCategory }),
          mongoose.model('PaymentType').exists({ _id: this.paymentType }),
        ]);
        if (!property || !fineType || !category || !type) {
          return next(new Error('Invalid reference to property, fine type, category, or payment type'));
        }
        next();
      });
      fineSchema.index({ propertyId: 1, fineDate: -1 });
      
      // Apply the auto-increment plugin (remove if fineID should remain a String)
     
      
      // Export the model
      module.exports = mongoose.model('Fine', fineSchema);