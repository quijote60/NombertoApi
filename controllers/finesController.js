
const mongoose = require('mongoose');
const Fine = require('../models/Fine');
const {validateFineData} = require('../utils/validation');
const asyncHandler = require('express-async-handler');

// Reusable validation function

// @desc Get all fines
// @route GET /fines
// @access Private
const getAllFines = asyncHandler(async (req, res) => {
  const fines = await Fine.find().lean();
  if (!fines?.length) {
    return res.status(404).json({ message: 'No fines found' });
  }
  res.status(200).json({ data: fines });
});

// @desc Create a new fine
// @route POST /fines
// @access Private
const createNewFine = asyncHandler(async (req, res) => {
  const validation = validateFineData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  // Check for duplicate fineId
  const duplicate = await Fine.findOne({ fineId: validation.fineData.fineId }).lean().exec();
  if (duplicate) {
    return res.status(409).json({ message: `Fine ID '${validation.fineData.fineId}' already exists` });
  }

  const fine = await Fine.create(validation.fineData);
  res.status(201).json({
    message: `Fine '${fine.fineId}' created`,
    data: fine,
  });
});

// @desc Update a fine
// @route PATCH /fines
// @access Private
const updateFine = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Validate ID
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Fine ID (_id) is required' });
  }

  const validation = validateFineData(req.body, true);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const fine = await Fine.findById(id).exec();
  if (!fine) {
    return res.status(404).json({ message: `Fine with ID ${id} not found` });
  }

  // Check for duplicate fineId (excluding current document)
  const duplicate = await Fine.findOne({ fineId: validation.fineData.fineId }).lean().exec();
  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(409).json({ message: `Fine ID '${validation.fineData.fineId}' already exists` });
  }

  Object.assign(fine, validation.fineData);
  const updatedFine = await fine.save();
  res.status(200).json({
    message: `Fine '${updatedFine.fineId}' updated`,
    data: updatedFine,
  });
});

// @desc Delete a fine
// @route DELETE /fines
// @access Private
const deleteFine = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Fine ID (_id) is required' });
  }

  const fine = await Fine.findById(id).exec();
  if (!fine) {
    return res.status(404).json({ message: `Fine with ID ${id} not found` });
  }

  const { fineId } = fine;
  await fine.deleteOne();

  res.status(200).json({
    message: `Fine '${fineId}' deleted`,
  });
});

module.exports = {
  getAllFines,
  createNewFine,
  updateFine,
  deleteFine,
};