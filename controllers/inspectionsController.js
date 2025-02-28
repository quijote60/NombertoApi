
const mongoose = require('mongoose');
const Inspection = require('../models/Inspections');
const asyncHandler = require('express-async-handler');

// Reusable validation function
const validateInspectionData = (data) => {
  const { propertyId, inspectionTypeId, inspectionDate, inspectedBy, inspectionAmount, paymentType, checkNumber } = data;

  const requiredFields = { propertyId, inspectionTypeId, inspectionDate, inspectedBy, inspectionAmount, paymentType };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (!mongoose.isValidObjectId(propertyId) || !mongoose.isValidObjectId(inspectionTypeId) || !mongoose.isValidObjectId(paymentType)) {
    return { valid: false, message: 'Invalid ObjectId format for propertyId, inspectionTypeId, or paymentType' };
  }

  const inspectionDateObj = new Date(inspectionDate);
  if (inspectionDateObj > new Date()) {
    return { valid: false, message: 'Inspection date cannot be in the future' };
  }

  if (typeof inspectedBy !== 'string' || inspectedBy.trim() === '') {
    return { valid: false, message: 'Inspected by must be a non-empty string' };
  }

  if (typeof inspectionAmount !== 'number' || inspectionAmount < 0) {
    return { valid: false, message: 'Inspection amount must be a non-negative number' };
  }

  if (checkNumber !== undefined && (typeof checkNumber !== 'number' || checkNumber < 0)) {
    return { valid: false, message: 'Check number must be a non-negative number' };
  }

  return {
    valid: true,
    inspectionData: {
      propertyId,
      inspectionTypeId,
      inspectionDate: inspectionDateObj,
      inspectedBy: inspectedBy.trim(),
      notes: data.notes ? data.notes.trim() : undefined,
      inspectionAmount,
      paymentType,
      checkNumber,
    },
  };
};

// @desc Get all inspections
// @route GET /inspections
// @access Private
const getAllInspections = asyncHandler(async (req, res) => {
  const inspections = await Inspection.find().lean();
  if (!inspections?.length) {
    return res.status(404).json({ message: 'No inspections found' });
  }
  res.status(200).json({ data: inspections });
});

// @desc Create a new inspection
// @route POST /inspections
// @access Private
const createNewInspection = asyncHandler(async (req, res) => {
  const validation = validateInspectionData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  // Check for duplicate (simplified to inspectionId uniqueness)
  const duplicate = await Inspection.findOne({ propertyId: validation.inspectionData.propertyId, inspectionDate: validation.inspectionData.inspectionDate }).lean().exec();
  if (duplicate) {
    return res.status(409).json({ message: 'An inspection for this property on this date already exists' });
  }

  const inspection = await Inspection.create(validation.inspectionData);
  res.status(201).json({
    message: `Inspection ${inspection.inspectionId} created`,
    data: inspection,
  });
});

// @desc Update an inspection
// @route PATCH /inspections
// @access Private
const updateInspection = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Inspection ID (_id) is required' });
  }

  const validation = validateInspectionData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const inspection = await Inspection.findById(id).exec();
  if (!inspection) {
    return res.status(404).json({ message: `Inspection with ID ${id} not found` });
  }

  const duplicate = await Inspection.findOne({ propertyId: validation.inspectionData.propertyId, inspectionDate: validation.inspectionData.inspectionDate }).lean().exec();
  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(409).json({ message: 'An inspection for this property on this date already exists' });
  }

  Object.assign(inspection, validation.inspectionData);
  const updatedInspection = await inspection.save();
  res.status(200).json({
    message: `Inspection ${updatedInspection.inspectionId} updated`,
    data: updatedInspection,
  });
});

// @desc Delete an inspection
// @route DELETE /inspections
// @access Private
const deleteInspection = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Inspection ID (_id) is required' });
  }

  const inspection = await Inspection.findById(id).exec();
  if (!inspection) {
    return res.status(404).json({ message: `Inspection with ID ${id} not found` });
  }

  const { inspectionId } = inspection;
  await inspection.deleteOne();

  res.status(200).json({
    message: `Inspection ${inspectionId} deleted`,
  });
});

module.exports = {
  getAllInspections,
  createNewInspection,
  updateInspection,
  deleteInspection,
};