const mongoose = require('mongoose');
const UtilityType = require('../models/UtilityTypes'); // Update path if renamed to UtilityType
const Utility = require('../models/Utilities'); // Update path if renamed to Utility
const asyncHandler = require('express-async-handler');

// Validation function
const validateUtilityTypeData = (data) => {
  const { utilityName, utilityProvider, active } = data;

  const requiredFields = { utilityName, utilityProvider };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (typeof utilityName !== 'string' || utilityName.trim() === '') {
    return { valid: false, message: 'Utility name must be a non-empty string' };
  }

  if (typeof utilityProvider !== 'string' || utilityProvider.trim() === '') {
    return { valid: false, message: 'Utility provider must be a non-empty string' };
  }

  if (active !== undefined && typeof active !== 'boolean') {
    return { valid: false, message: 'Active must be a boolean' };
  }

  return {
    valid: true,
    utilityTypeData: {
      utilityName: utilityName.trim(),
      utilityProvider: utilityProvider.trim(),
      active: active !== undefined ? active : true,
    },
  };
};

// @desc Get all utility types
// @route GET /utility-types
// @access Private
const getAllUtilityTypes = asyncHandler(async (req, res) => {
  const utilityTypes = await UtilityType.find().lean();
  if (!utilityTypes?.length) {
    return res.status(404).json({ message: 'No utility types found' });
  }
  res.status(200).json({ data: utilityTypes });
});

// @desc Create a new utility type
// @route POST /utility-types
// @access Private
const createNewUtilityType = asyncHandler(async (req, res) => {
  const validation = validateUtilityTypeData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const utilityType = await UtilityType.create(validation.utilityTypeData);
  res.status(201).json({
    message: `Utility type ${utilityType.utilityName} with provider ${utilityType.utilityProvider} created`,
    data: utilityType,
  });
});

// @desc Update a utility type
// @route PATCH /utility-types
// @access Private
const updateUtilityType = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Utility Type ID (_id) is required' });
  }

  const validation = validateUtilityTypeData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const utilityType = await UtilityType.findById(id).exec();
  if (!utilityType) {
    return res.status(404).json({ message: `Utility type with ID ${id} not found` });
  }

  Object.assign(utilityType, validation.utilityTypeData);
  const updatedUtilityType = await utilityType.save();
  res.status(200).json({
    message: `Utility type ${updatedUtilityType.utilityName} updated`,
    data: updatedUtilityType,
  });
});

// @desc Delete a utility type
// @route DELETE /utility-types
// @access Private
const deleteUtilityType = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Utility Type ID (_id) is required' });
  }

  const utilityType = await UtilityType.findById(id).exec();
  if (!utilityType) {
    return res.status(404).json({ message: `Utility type with ID ${id} not found` });
  }

  // Check for dependencies in Utilities
  const utility = await Utility.findOne({ utilityTypeId: id }).lean().exec();
  if (utility) {
    return res.status(400).json({
      message: `Cannot delete utility type '${utilityType.utilityName}' with ID ${utilityType.utilityTypeId} because it is referenced by at least one utility record`
    });
  }

  const { utilityName, utilityTypeId } = utilityType;
  await utilityType.deleteOne();

  res.status(200).json({
    message: `Utility type '${utilityName}' with ID ${utilityTypeId} deleted`,
  });
});

module.exports = {
  getAllUtilityTypes,
  createNewUtilityType,
  updateUtilityType,
  deleteUtilityType,
};