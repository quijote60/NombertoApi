const mongoose = require('mongoose');
const LeasePayment = require('../models/leasePayment');
const Lease = require('../models/Lease');
const asyncHandler = require('express-async-handler');

// Validation function
const validateLeasePaymentData = (data) => {
  const { leaseId, paymentType, paymentCategory, paymentDate, paymentAmount, notes, paymentDueDate } = data;

  const requiredFields = { leaseId, paymentType, paymentCategory, paymentDate, paymentAmount };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (typeof leaseId !== 'string' || leaseId.trim() === '') {
    return { valid: false, message: 'Lease ID must be a non-empty string' };
  }

  if (!mongoose.isValidObjectId(paymentType) || !mongoose.isValidObjectId(paymentCategory)) {
    return { valid: false, message: 'Invalid ObjectId format for paymentType or paymentCategory' };
  }

  const paymentDateObj = new Date(paymentDate);
  if (paymentDateObj > new Date()) {
    return { valid: false, message: 'Payment date cannot be in the future' };
  }

  const paymentDueDateObj = paymentDueDate ? new Date(paymentDueDate) : null;
  if (paymentDueDateObj && paymentDueDateObj < paymentDateObj) {
    return { valid: false, message: 'Payment due date must be on or after payment date' };
  }

  if (typeof paymentAmount !== 'number' || paymentAmount < 0) {
    return { valid: false, message: 'Payment amount must be a non-negative number' };
  }

  return {
    valid: true,
    leasePaymentData: {
      leaseId,
      paymentType,
      paymentCategory,
      paymentDate: paymentDateObj,
      paymentAmount,
      notes: notes ? notes.trim() : undefined,
      paymentDueDate: paymentDueDateObj || undefined,
    },
  };
};

// @desc Get all lease payments
// @route GET /lease-payments
// @access Private
const getAllLeasePayments = asyncHandler(async (req, res) => {
  const leasePayments = await LeasePayment.find().lean();
  if (!leasePayments?.length) {
    return res.status(404).json({ message: 'No lease payments found' });
  }
  res.status(200).json({ data: leasePayments });
});

// @desc Create a new lease payment
// @route POST /lease-payments
// @access Private
const createNewLeasePayment = asyncHandler(async (req, res) => {
  const validation = validateLeasePaymentData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  // Validate leaseId exists in Lease collection using the leaseId field
  const lease = await Lease.findOne({ leaseId: validation.leasePaymentData.leaseId }).lean().exec();
  if (!lease) {
    return res.status(400).json({ message: `Lease with ID ${validation.leasePaymentData.leaseId} not found` });
  }

  const leasePayment = await LeasePayment.create(validation.leasePaymentData);
  res.status(201).json({
    message: `Lease payment ${leasePayment.leasePaymentId} created`,
    data: leasePayment,
  });
});

// @desc Update a lease payment
// @route PATCH /lease-payments
// @access Private
const updateLeasePayment = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Lease Payment ID (_id) is required' });
  }

  const validation = validateLeasePaymentData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const leasePayment = await LeasePayment.findById(id).exec();
  if (!leasePayment) {
    return res.status(404).json({ message: `Lease payment with ID ${id} not found` });
  }

  const lease = await Lease.findOne({ leaseId: validation.leasePaymentData.leaseId }).lean().exec();
  if (!lease) {
    return res.status(400).json({ message: `Lease with ID ${validation.leasePaymentData.leaseId} not found` });
  }

  Object.assign(leasePayment, validation.leasePaymentData);
  const updatedLeasePayment = await leasePayment.save();
  res.status(200).json({
    message: `Lease payment ${updatedLeasePayment.leasePaymentId} updated`,
    data: updatedLeasePayment,
  });
});

// @desc Delete a lease payment
// @route DELETE /lease-payments
// @access Private
const deleteLeasePayment = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Lease Payment ID (_id) is required' });
  }

  const leasePayment = await LeasePayment.findById(id).exec();
  if (!leasePayment) {
    return res.status(404).json({ message: `Lease payment with ID ${id} not found` });
  }

  const { leasePaymentId } = leasePayment;
  await leasePayment.deleteOne();
  res.status(200).json({
    message: `Lease payment ${leasePaymentId} deleted`,
  });
});

module.exports = {
  getAllLeasePayments,
  createNewLeasePayment,
  updateLeasePayment,
  deleteLeasePayment,
};