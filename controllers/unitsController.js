const mongoose = require('mongoose');
const Unit = require('../models/Unit');
const Lease = require('../models/Lease');
const asyncHandler = require('express-async-handler');

// Validation function
const validateUnitData = (data) => {
  const { unitNumber, propertyId, rented, bedrooms, bathrooms, notes } = data;

  const requiredFields = { unitNumber, propertyId, rented };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (typeof unitNumber !== 'string' || unitNumber.trim() === '') {
    return { valid: false, message: 'Unit number must be a non-empty string' };
  }

  if (!mongoose.isValidObjectId(propertyId)) {
    return { valid: false, message: 'Invalid ObjectId format for propertyId' };
  }

  if (typeof rented !== 'boolean') {
    return { valid: false, message: 'Rented must be a boolean' };
  }

  if (bedrooms !== undefined && (typeof bedrooms !== 'number' || bedrooms < 0 || bedrooms > 20)) {
    return { valid: false, message: 'Bedrooms must be a number between 0 and 20' };
  }

  if (bathrooms !== undefined && (typeof bathrooms !== 'number' || bathrooms < 0 || bathrooms > 20)) {
    return { valid: false, message: 'Bathrooms must be a number between 0 and 20' };
  }

  return {
    valid: true,
    unitData: {
      unitNumber: unitNumber.trim(),
      propertyId,
      rented,
      bedrooms,
      bathrooms,
      notes: notes ? notes.trim() : undefined,
    },
  };
};

// @desc Get all units
// @route GET /units
// @access Private
const getAllUnits = asyncHandler(async (req, res) => {
  const units = await Unit.find().lean();
  if (!units?.length) {
    return res.status(404).json({ message: 'No units found' });
  }
  res.status(200).json({ data: units });
});

// @desc Create a new unit
// @route POST /units
// @access Private
const createNewUnit = asyncHandler(async (req, res) => {
  const validation = validateUnitData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }
  const duplicate = await Unit.findOne({
      unitNumber: validation.unitData.unitNumber,
      propertyId: validation.unitData.propertyId,
    })
      .collation({ locale: 'en', strength: 2 })
      .lean()
      .exec();
  
    if (duplicate) {
      return res.status(409).json({
        message: `Unit '${duplicate.unitNumber} with ID ${duplicate._id} already exists`,
      });
    }
  const unit = await Unit.create(validation.unitData);
  res.status(201).json({
    message: `Unit ${unit.unitNumber} created`,
    data: unit,
  });
});

// @desc Update a unit
// @route PATCH /units
// @access Private
const updateUnit = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Unit ID (_id) is required' });
  }

  const validation = validateUnitData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }
  const duplicate = await Unit.findOne({
    unitNumber: validation.unitData.unitNumber,
    propertyId: validation.unitData.propertyId,
    _id: { $ne: id },
  })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({
      message: `Unit '${duplicate.unitNumber} with ID ${duplicate._id} already exists`,
    });
  }

  const unit = await Unit.findById(id).exec();
  if (!unit) {
    return res.status(404).json({ message: `Unit with ID ${id} not found` });
  }

  Object.assign(unit, validation.unitData);
  const updatedUnit = await unit.save();
  res.status(200).json({
    message: `Unit ${updatedUnit.unitNumber} updated`,
    data: updatedUnit,
  });
});

// @desc Delete a unit
// @route DELETE /units
// @access Private
const deleteUnit = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Unit ID (_id) is required' });
  }

  const lease = await Lease.findOne({ unitId: id, active: true }).lean().exec();
  if (lease) {
    return res.status(400).json({ message: 'Unit is currently rented under an active lease' });
  }

  const unit = await Unit.findById(id).exec();
  if (!unit) {
    return res.status(404).json({ message: `Unit with ID ${id} not found` });
  }

  const { unitNumber } = unit;
  await unit.deleteOne();

  res.status(200).json({
    message: `Unit ${unitNumber} deleted`,
  });
});

module.exports = {
  getAllUnits,
  createNewUnit,
  updateUnit,
  deleteUnit,
};