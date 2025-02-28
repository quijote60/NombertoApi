const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const expenseTypeSchema = new mongoose.Schema({
    expenseTypeId: {
        type: Number,
        unique: true
    },
    expenseType: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 50,
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 200,
        default: ''
    }
}, {
    timestamps: true
});

expenseTypeSchema.plugin(AutoIncrement, {
    id: 'expenseType_seq',
    inc_field: 'expenseTypeID',
    start_seq: 100
});

module.exports = mongoose.model('ExpenseType', expenseTypeSchema);