const mongoose = require('mongoose');
const Utility = require('../models/Utilities'); // Updated to match singular model name
const asyncHandler = require('express-async-handler');

// Validation function
const validateUtilityData = (data) => {
  const { propertyId, utilityTypeId, paymentDate, amount, paymentType, paymentCategory, readingDate, meterReading, checkNumber } = data;

  const requiredFields = { propertyId, utilityTypeId, paymentDate, amount, paymentType, paymentCategory };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (!mongoose.isValidObjectId(propertyId) || !mongoose.isValidObjectId(utilityTypeId) || 
      !mongoose.isValidObjectId(paymentType) || !mongoose.isValidObjectId(paymentCategory)) {
    return { valid: false, message: 'Invalid ObjectId format for propertyId, utilityTypeId, paymentType, or paymentCategory' };
  }

  const paymentDateObj = new Date(paymentDate);
  if (isNaN(paymentDateObj) || paymentDateObj > new Date()) {
    return { valid: false, message: 'Payment date must be a valid date and not in the future' };
  }

  if (typeof amount !== 'number' || amount < 0) {
    return { valid: false, message: 'Amount must be a non-negative number' };
  }

  const readingDateObj = readingDate ? new Date(readingDate) : null;
  if (readingDateObj && readingDateObj > new Date()) {
    return { valid: false, message: 'Reading date cannot be in the future' };
  }
  if (readingDateObj && readingDateObj > paymentDateObj) {
    return { valid: false, message: 'Reading date cannot be after payment date' };
  }

  if (meterReading !== undefined && (typeof meterReading !== 'number' || meterReading < 0)) {
    return { valid: false, message: 'Meter reading must be a non-negative number' };
  }

  if (checkNumber !== undefined && (typeof checkNumber !== 'number' || checkNumber < 0)) {
    return { valid: false, message: 'Check number must be a non-negative number' };
  }

  return {
    valid: true,
    utilityData: {
      propertyId,
      utilityTypeId,
      paymentDate: paymentDateObj,
      amount,
      paymentType,
      paymentCategory,
      readingDate: readingDateObj || undefined,
      meterReading,
      checkNumber,
    },
  };
};

// @desc Get all utilities
// @route GET /utilities
// @access Private
const getAllUtilities = asyncHandler(async (req, res) => {
  const utilities = await Utility.find().lean();
  if (!utilities?.length) {
    return res.status(404).json({ message: 'No utilities found' });
  }
  res.status(200).json({ data: utilities });
});

// @desc Create a new utility
// @route POST /utilities
// @access Private
const createNewUtility = asyncHandler(async (req, res) => {
  const validation = validateUtilityData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }
  const duplicate = await Utility.findOne({ propertyId: validation.utilityData.propertyId, 
    utilityTypeId: validation.utilityData.utilityTypeId,
    amount: validation.utilityData.amount,
    paymentDate: validation.utilityData.paymentDate,
    
 
 }).lean().exec();
    if (duplicate) {
      return res.status(409).json({ message: 'A utility payment for this property on this date already exists' });
    }

  const utility = await Utility.create(validation.utilityData);
  res.status(201).json({
    message: `Utility ${utility.utilityId} created`,
    data: utility,
  });
});

// @desc Update a utility
// @route PATCH /utilities
// @access Private
const updateUtility = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Utility ID (_id) is required' });
  }

  const validation = validateUtilityData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const duplicate = await Inspection.findOne({ propertyId: validation.utilityData.propertyId,
    utilityTypeId: validation.utilityData.utilityTypeId,
    amount: validation.utilityData.amount,
    paymentDate: validation.utilityData.paymentDate,
}).lean().exec();
    if (duplicate && duplicate._id.toString() !== id) {
      return res.status(409).json({ message: 'A utility for this property on this date already exists' });
    }

  const utility = await Utility.findById(id).exec();
  if (!utility) {
    return res.status(404).json({ message: `Utility with ID ${id} not found` });
  }

  Object.assign(utility, validation.utilityData);
  const updatedUtility = await utility.save();
  res.status(200).json({
    message: `Utility ${updatedUtility.utilityId} updated`,
    data: updatedUtility,
  });
});

// @desc Delete a utility
// @route DELETE /utilities
// @access Private
const deleteUtility = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Utility ID (_id) is required' });
  }

  const utility = await Utility.findById(id).exec();
  if (!utility) {
    return res.status(404).json({ message: `Utility with ID ${id} not found` });
  }

  const { utilityId } = utility;
  await utility.deleteOne();

  res.status(200).json({
    message: `Utility ${utilityId} deleted`,
  });
});

module.exports = {
  getAllUtilities,
  createNewUtility,
  updateUtility,
  deleteUtility,
};