const PaymentType = require('../models/PaymentType');
const Expense = require('../models/Expense');
const Fine = require('../models/Fine');
const mongoose = require('mongoose');

// @desc Get all payment types
// @route GET /payment-types
// @access Private
const getAllPaymentTypes = async (req, res) => {
  try {
    const paymentTypes = await PaymentType.find().lean();
    if (!paymentTypes?.length) {
      return res.status(404).json({ message: 'No payment types found' });
    }
    res.status(200).json({ data: paymentTypes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc Create a new payment type
// @route POST /payment-types
// @access Private
const createNewPaymentType = async (req, res) => {
  const { paymentType } = req.body;

  // Validate input
  if (!paymentType || typeof paymentType !== 'string' || paymentType.trim() === '') {
    return res.status(400).json({ message: 'Payment type is required and must be a non-empty string' });
  }

  try {
    // Check for duplicate (case-insensitive)
    const duplicate = await PaymentType.findOne({ paymentType })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();

    if (duplicate) {
      return res.status(409).json({ message: `Payment type '${paymentType}' already exists` });
    }

    const paymentTypeObject = { paymentType: paymentType.trim() };
    const newPaymentType = await PaymentType.create(paymentTypeObject);

    res.status(201).json({
      message: `Payment type '${newPaymentType.paymentType}' created`,
      data: newPaymentType,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payment type', error: error.message });
  }
};

// @desc Update a payment type
// @route PATCH /payment-types
// @access Private
const updatePaymentType = async (req, res) => {
  const { id, paymentType } = req.body;

  // Validate input
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Payment type ID is required' });
  }
  if (!paymentType || typeof paymentType !== 'string' || paymentType.trim() === '') {
    return res.status(400).json({ message: 'Payment type is required and must be a non-empty string' });
  }

  try {
    const paymentTypeDoc = await PaymentType.findById(id).exec();
    if (!paymentTypeDoc) {
      return res.status(404).json({ message: `Payment type with ID ${id} not found` });
    }

    // Check for duplicate (excluding current document)
    const duplicate = await PaymentType.findOne({ paymentType })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();
    if (duplicate && duplicate._id.toString() !== id) {
      return res.status(409).json({ message: `Payment type '${paymentType}' already exists` });
    }

    paymentTypeDoc.paymentType = paymentType.trim();
    const updatedPaymentType = await paymentTypeDoc.save();

    res.status(200).json({
      message: `Payment type '${updatedPaymentType.paymentType}' updated`,
      data: updatedPaymentType,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment type', error: error.message });
  }
};

// @desc Delete a payment type
// @route DELETE /payment-types
// @access Private
const deletePaymentType = async (req, res) => {
  const { id } = req.body;

  // Validate input
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Payment type ID is required' });
  }
   const expense = await Expense.findOne({ paymentType: id }).lean().exec()
    const fine = await Fine.findOne({ paymentType: id }).lean().exec()

    if (expense) {
        return res.status(400).json({ message: 'Payment Type has assigned expenses' })
    } else if (fine){
        return res.status(400).json({ message: 'Payment Type has assigned fines' })
    }

  try {
    const paymentType = await PaymentType.findById(id).exec();
    if (!paymentType) {
      return res.status(404).json({ message: `Payment type with ID ${id} not found` });
    }

    const { paymentType: name, paymentTypeId } = paymentType;
    await paymentType.deleteOne();

    res.status(200).json({
      message: `Payment type '${name}' with ID ${paymentTypeId} deleted`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete payment type', error: error.message });
  }
};

module.exports = {
  getAllPaymentTypes,
  createNewPaymentType,
  updatePaymentType,
  deletePaymentType,
};