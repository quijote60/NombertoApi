const mongoose = require('mongoose');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Validation function
const validateUserData = (data, isUpdate = false) => {
  const { username, password, roles, active } = data;

  const requiredFields = isUpdate ? { username, roles, active } : { username, password, roles };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 50) {
    return { valid: false, message: 'Username must be a string between 3 and 50 characters' };
  }

  if (!isUpdate && (typeof password !== 'string' || password.length < 6)) {
    return { valid: false, message: 'Password must be a string with at least 6 characters' };
  }

  if (!Array.isArray(roles) || !roles.length || !roles.every(role => ['Employee', 'Manager', 'Admin'].includes(role))) {
    return { valid: false, message: 'Roles must be a non-empty array of valid roles (Employee, Manager, Admin)' };
  }

  if (isUpdate && typeof active !== 'boolean') {
    return { valid: false, message: 'Active must be a boolean' };
  }

  return {
    valid: true,
    userData: {
      username: username.trim(),
      ...(password && { password }), // Only include password if provided
      roles,
      ...(isUpdate && { active }), // Only include active on update
    },
  };
};

// @desc Get all users
// @route GET /users
// @access Private - Requires authentication
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').lean();
  if (!users?.length) {
    return res.status(404).json({ message: 'No users found' });
  }
  res.status(200).json({ data: users });
});

// @desc Create a new user
// @route POST /users
// @access Private - Requires admin privileges
const createNewUser = asyncHandler(async (req, res) => {
  const validation = validateUserData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const user = await User.create(validation.userData);
  res.status(201).json({
    message: `User ${user.username} created`,
    data: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }),
  });
});

// @desc Update a user
// @route PATCH /users
// @access Private - Requires admin privileges
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid User ID (_id) is required' });
  }

  const validation = validateUserData(req.body, true);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(404).json({ message: `User with ID ${id} not found` });
  }

  Object.assign(user, validation.userData);
  const updatedUser = await user.save();
  res.status(200).json({
    message: `User ${updatedUser.username} updated`,
    data: updatedUser.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }),
  });
});

// @desc Delete a user
// @route DELETE /users
// @access Private - Requires admin privileges
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid User ID (_id) is required' });
  }

  const user = await User.findById(id).exec();
  if (!user) {
    return res.status(404).json({ message: `User with ID ${id} not found` });
  }

  const { username } = user;
  await user.deleteOne();

  res.status(200).json({
    message: `User ${username} deleted`,
  });
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};