const PaymentCategory = require('../models/PaymentCategory');

// @desc Get all payment categories
// @route GET /paymentcategories
// @access Private
const getAllPaymentCategories = async (req, res) => {
    try {
        const paymentCategories = await PaymentCategory.find().lean();
        res.json(paymentCategories.length ? paymentCategories : []);
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error while fetching payment categories' });
    }
};

// @desc Create new payment category
// @route POST /paymentcategories
// @access Private
const createNewPaymentCategory = async (req, res) => {
    const { paymentCategory, description } = req.body;

    if (!paymentCategory) {
        return res.status(400).json({ error: true, message: 'Payment category is required' });
    }

    try {
        const duplicate = await PaymentCategory.findOne({ paymentCategory })
            .collation({ locale: 'en', strength: 2 }).lean();
        if (duplicate) {
            return res.status(409).json({ error: true, message: 'Duplicate payment category' });
        }

        const paymentCategoryObject = { paymentCategory, description };
        const paymentCategoryDoc = await PaymentCategory.create(paymentCategoryObject);

        res.status(201).json({
            message: `New payment category ${paymentCategoryDoc.paymentCategory} created`,
            data: paymentCategoryDoc
        });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error while creating payment category' });
    }
};

// @desc Update a payment category
// @route PATCH /paymentcategories
// @access Private
const updatePaymentCategory = async (req, res) => {
    const { id, paymentCategory, description } = req.body;

    if (!id || !paymentCategory) {
        return res.status(400).json({ error: true, message: 'ID and payment category are required' });
    }

    try {
        const paymentCategoryDoc = await PaymentCategory.findById(id).exec();
        if (!paymentCategoryDoc) {
            return res.status(404).json({ error: true, message: 'Payment category not found' });
        }

        const duplicate = await PaymentCategory.findOne({ paymentCategory })
            .collation({ locale: 'en', strength: 2 }).lean();
        if (duplicate && duplicate._id.toString() !== id) {
            return res.status(409).json({ error: true, message: 'Duplicate payment category' });
        }

        paymentCategoryDoc.paymentCategory = paymentCategory;
        if (description !== undefined) paymentCategoryDoc.description = description;

        const updatedCategory = await paymentCategoryDoc.save();
        res.json({
            message: `${updatedCategory.paymentCategory} updated`,
            data: updatedCategory
        });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error while updating payment category' });
    }
};

// @desc Delete a payment category
// @route DELETE /paymentcategories
// @access Private
const deletePaymentCategory = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: true, message: 'Payment category ID required' });
    }

    try {
        const paymentCategory = await PaymentCategory.findById(id).exec();
        if (!paymentCategory) {
            return res.status(404).json({ error: true, message: 'Payment category not found' });
        }

        await paymentCategory.deleteOne();
        res.json({
            message: `Payment category ${paymentCategory.paymentCategory} with ID ${paymentCategory.paymentCategoryID} deleted`
        });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Server error while deleting payment category' });
    }
};

module.exports = {
    getAllPaymentCategories,
    createNewPaymentCategory,
    updatePaymentCategory,
    deletePaymentCategory
};