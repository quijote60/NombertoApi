const mongoose = require('mongoose');
const InspectionType = require('../models/InspectionType');
const Inspection = require('../models/Inspections');
const asyncHandler = require('express-async-handler');

// @desc Get all inspection types
// @route GET /inspection-types
// @access Private
const getAllInspectionTypes = asyncHandler(async (req, res) => {
  const inspectionTypes = await InspectionType.find().lean();
  if (!inspectionTypes?.length) {
    return res.status(404).json({ message: 'No inspection types found' });
  }
  res.status(200).json({ data: inspectionTypes });
});

// @desc Create a new inspection type
// @route POST /inspection-types
// @access Private
const createNewInspectionType = asyncHandler(async (req, res) => {
  const { inspectionType } = req.body;

  // Validate input
  if (!inspectionType || typeof inspectionType !== 'string' || inspectionType.trim() === '') {
    return res.status(400).json({ message: 'Inspection type must be a non-empty string' });
  }

  // Check for duplicate (case-insensitive)
  const duplicate = await InspectionType.findOne({ inspectionType })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();
  if (duplicate) {
    return res.status(409).json({ message: `Inspection type '${inspectionType}' already exists` });
  }

  const inspectionTypeObject = { inspectionType: inspectionType.trim() };
  const newInspectionType = await InspectionType.create(inspectionTypeObject);

  res.status(201).json({
    message: `Inspection type '${newInspectionType.inspectionType}' created`,
    data: newInspectionType,
  });
});

// @desc Update an inspection type
// @route PATCH /inspection-types
// @access Private
const updateInspectionType = asyncHandler(async (req, res) => {
  const { id, inspectionType } = req.body;

  // Validate input
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Inspection type ID is required' });
  }
  if (!inspectionType || typeof inspectionType !== 'string' || inspectionType.trim() === '') {
    return res.status(400).json({ message: 'Inspection type must be a non-empty string' });
  }

  const inspectionTypeDoc = await InspectionType.findById(id).exec();
  if (!inspectionTypeDoc) {
    return res.status(404).json({ message: `Inspection type with ID ${id} not found` });
  }

  // Check for duplicate (excluding current document)
  const duplicate = await InspectionType.findOne({ inspectionType })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();
  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(409).json({ message: `Inspection type '${inspectionType}' already exists` });
  }

  inspectionTypeDoc.inspectionType = inspectionType.trim();
  const updatedInspectionType = await inspectionTypeDoc.save();

  res.status(200).json({
    message: `Inspection type '${updatedInspectionType.inspectionType}' updated`,
    data: updatedInspectionType,
  });
});

// @desc Delete an inspection type
// @route DELETE /inspection-types
// @access Private
const deleteInspectionType = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Validate input
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Inspection type ID is required' });
  }

  // Check for dependencies (assuming Inspection model uses inspectionTypeId)
  const inspection = await Inspection.findOne({ inspectionTypeId: id }).lean().exec();
  if (inspection) {
    return res.status(400).json({ message: 'Inspection type is referenced in existing inspections' });
  }

  const inspectionType = await InspectionType.findById(id).exec();
  if (!inspectionType) {
    return res.status(404).json({ message: `Inspection type with ID ${id} not found` });
  }

  const { inspectionType: name, inspectionTypeId } = inspectionType;
  await inspectionType.deleteOne();

  res.status(200).json({
    message: `Inspection type '${name}' with ID ${inspectionTypeId} deleted`,
  });
});

module.exports = {
  getAllInspectionTypes,
  createNewInspectionType,
  updateInspectionType,
  deleteInspectionType,
};