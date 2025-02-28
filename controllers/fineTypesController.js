const mongoose = require('mongoose');
const FineType = require('../models/FineType');
const Fine = require('../models/Fine');
const asyncHandler = require('express-async-handler'); // Added for consistency with other controllers

// @desc Get all fine types
// @route GET /fine-types
// @access Private
const getAllFineTypes = asyncHandler(async (req, res) => {
  const fineTypes = await FineType.find().lean();
  if (!fineTypes?.length) {
    return res.status(404).json({ message: 'No fine types found' });
  }
  res.status(200).json({ data: fineTypes });
});

// @desc Create a new fine type
// @route POST /fine-types
// @access Private
const createNewFineType = asyncHandler(async (req, res) => {
  const { fineType } = req.body;

  // Validate input
  if (!fineType || typeof fineType !== 'string' || fineType.trim() === '') {
    return res.status(400).json({ message: 'Fine type is required and must be a non-empty string' });
  }

  // Check for duplicate (case-insensitive)
  const duplicate = await FineType.findOne({ fineType })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();
  if (duplicate) {
    return res.status(409).json({ message: `Fine type '${fineType}' already exists` });
  }

  const fineTypeObject = { fineType: fineType.trim() };
  const newFineType = await FineType.create(fineTypeObject);

  res.status(201).json({
    message: `Fine type '${newFineType.fineType}' created`,
    data: newFineType,
  });
});

// @desc Update a fine type
// @route PATCH /fine-types
// @access Private
const updateFineType = asyncHandler(async (req, res) => {
  const { id, fineType } = req.body;

  // Validate input
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Fine type ID is required' });
  }
  if (!fineType || typeof fineType !== 'string' || fineType.trim() === '') {
    return res.status(400).json({ message: 'Fine type is required and must be a non-empty string' });
  }

  const fineTypeDoc = await FineType.findById(id).exec();
  if (!fineTypeDoc) {
    return res.status(404).json({ message: `Fine type with ID ${id} not found` });
  }

  // Check for duplicate (excluding current document)
  const duplicate = await FineType.findOne({ fineType })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();
  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(409).json({ message: `Fine type '${fineType}' already exists` });
  }

  fineTypeDoc.fineType = fineType.trim();
  const updatedFineType = await fineTypeDoc.save();

  res.status(200).json({
    message: `Fine type '${updatedFineType.fineType}' updated`,
    data: updatedFineType,
  });
});

// @desc Delete a fine type
// @route DELETE /fine-types
// @access Private
const deleteFineType = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Validate input
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Fine type ID is required' });
  }

  // Check for dependencies
  const fine = await Fine.findOne({ fineType: id }).lean().exec();
  if (fine) {
    return res.status(400).json({ message: 'Fine type is referenced in existing fines' });
  }

  const fineType = await FineType.findById(id).exec();
  if (!fineType) {
    return res.status(404).json({ message: `Fine type with ID ${id} not found` });
  }

  const { fineType: name, fineTypeId } = fineType;
  await fineType.deleteOne();

  res.status(200).json({
    message: `Fine type '${name}' with ID ${fineTypeId} deleted`,
  });
});

module.exports = {
  getAllFineTypes,
  createNewFineType,
  updateFineType,
  deleteFineType,
};