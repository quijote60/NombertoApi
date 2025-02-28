const mongoose = require('mongoose');
const Resident = require('../models/Resident');
const asyncHandler = require('express-async-handler');

// Validation function
const validateResidentData = (data, isUpdate = false) => {
  const { firstName, lastName, email, mobileNumber, homeNumber, notes, active } = data;

  const requiredFields = { firstName, lastName };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (typeof firstName !== 'string' || firstName.trim() === '') {
    return { valid: false, message: 'First name must be a non-empty string' };
  }

  if (typeof lastName !== 'string' || lastName.trim() === '') {
    return { valid: false, message: 'Last name must be a non-empty string' };
  }

  if (email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    return { valid: false, message: 'Email must be a valid email address' };
  }

  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (mobileNumber && !phoneRegex.test(mobileNumber)) {
    return { valid: false, message: 'Mobile number must be a valid phone number (e.g., +12025550123)' };
  }

  if (homeNumber && !phoneRegex.test(homeNumber)) {
    return { valid: false, message: 'Home number must be a valid phone number (e.g., +12025550123)' };
  }

  if (notes && typeof notes !== 'string') {
    return { valid: false, message: 'Notes must be a string' };
  }

  if (isUpdate && active !== undefined && typeof active !== 'boolean') {
    return { valid: false, message: 'Active must be a boolean' };
  }

  return {
    valid: true,
    residentData: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      mobileNumber: mobileNumber ? mobileNumber.trim() : undefined,
      homeNumber: homeNumber ? homeNumber.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
      ...(isUpdate && active !== undefined && { active }),
    },
  };
};

// @desc Get all residents
// @route GET /residents
// @access Private
const getAllResidents = asyncHandler(async (req, res) => {
  const residents = await Resident.find().lean();
  if (!residents?.length) {
    return res.status(404).json({ message: 'No residents found' });
  }
  res.status(200).json({ data: residents });
});

// @desc Create a new resident
// @route POST /residents
// @access Private
const createNewResident = asyncHandler(async (req, res) => {
  const validation = validateResidentData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  // Use validated data for duplicate check
  const duplicate = await Resident.findOne({
    firstName: validation.residentData.firstName,
    lastName: validation.residentData.lastName,
  })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({
      message: `Resident '${duplicate.firstName} ${duplicate.lastName}' with ID ${duplicate.residentId} already exists`,
    });
  }

  const resident = await Resident.create(validation.residentData);
  res.status(201).json({
    message: `Resident ${resident.firstName} ${resident.lastName} with ID ${resident.residentId} created`,
    data: resident,
  });
});

// @desc Update a resident
// @route PATCH /residents
// @access Private
const updateResident = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Resident ID (_id) is required' });
  }

  const validation = validateResidentData(req.body, true);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const resident = await Resident.findById(id).exec();
  if (!resident) {
    return res.status(404).json({ message: `Resident with ID ${id} not found` });
  }

  // Check for duplicate excluding the current resident
  const duplicate = await Resident.findOne({
    firstName: validation.residentData.firstName,
    lastName: validation.residentData.lastName,
    _id: { $ne: id }, // Exclude the current resident
  })
    .lean()
    .exec();

  if (duplicate) {
    return res.status(409).json({
      message: `Resident '${duplicate.firstName} ${duplicate.lastName}' with ID ${duplicate.residentId} already exists`,
    });
  }

  Object.assign(resident, validation.residentData);
  const updatedResident = await resident.save();
  res.status(200).json({
    message: `Resident ${updatedResident.firstName} ${updatedResident.lastName} with ID ${updatedResident.residentId} updated`,
    data: updatedResident,
  });
});

// @desc Delete a resident
// @route DELETE /residents
// @access Private
const deleteResident = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Resident ID (_id) is required' });
  }

  const resident = await Resident.findById(id).exec();
  if (!resident) {
    return res.status(404).json({ message: `Resident with ID ${id} not found` });
  }

  const { firstName, lastName, residentId } = resident;
  await resident.deleteOne();

  res.status(200).json({
    message: `Resident ${firstName} ${lastName} with ID ${residentId} deleted`,
  });
});

module.exports = {
  getAllResidents,
  createNewResident,
  updateResident,
  deleteResident,
};