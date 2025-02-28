const mongoose = require('mongoose');
const Property = require('../models/Properties'); // Renamed to singular for consistency
const Expense = require('../models/Expense');
const Fine = require('../models/Fine');
const Inspections = require('../models/Inspections');
const Lease = require('../models/Lease');
const Unit = require('../models/Unit');
const Utilities = require('../models/Utilities');
const asyncHandler = require('express-async-handler');

// @desc Get all properties
// @route GET /properties
// @access Private
const getAllProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find().lean();
  if (!properties?.length) {
    return res.status(404).json({ message: 'No properties found' });
  }
  res.status(200).json({ data: properties });
});

// @desc Create a new property
// @route POST /properties
// @access Private
const createNewProperty = asyncHandler(async (req, res) => {
  const { name, address, city, state, zipcode, unitCount } = req.body;

  // Validate input
  if (!name || !address || !city || !state) {
    return res.status(400).json({ message: 'Name, address, city, and state are required' });
  }
  if (typeof state !== 'string' || state.length !== 2) {
    return res.status(400).json({ message: 'State must be a 2-character string' });
  }
  if (zipcode && (typeof zipcode !== 'number' || zipcode < 0 || zipcode > 99999)) {
    return res.status(400).json({ message: 'Zipcode must be a number between 0 and 99999' });
  }
  if (unitCount && (typeof unitCount !== 'number' || unitCount < 0)) {
    return res.status(400).json({ message: 'Unit count must be a non-negative number' });
  }

  // Check for duplicate
  const duplicate = await Property.findOne({ name, address, city, state })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();
  if (duplicate) {
    return res.status(409).json({ message: `Property '${name}' at '${address}' already exists` });
  }

  const propertyObj = {
    name: name.trim(),
    address: address.trim(),
    city: city.trim(),
    state: state.trim().toUpperCase(),
    zipcode,
    unitCount,
  };

  const property = await Property.create(propertyObj);
  res.status(201).json({
    message: `Property '${property.name}' created`,
    data: property,
  });
});

// @desc Update a property
// @route PATCH /properties
// @access Private
const updateProperty = asyncHandler(async (req, res) => {
  const { id, name, address, city, state, zipcode, unitCount } = req.body;

  // Validate input
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Property ID is required' });
  }
  if (!name || !address || !city || !state) {
    return res.status(400).json({ message: 'Name, address, city, and state are required' });
  }
  if (typeof state !== 'string' || state.length !== 2) {
    return res.status(400).json({ message: 'State must be a 2-character string' });
  }
  if (zipcode && (typeof zipcode !== 'number' || zipcode < 0 || zipcode > 99999)) {
    return res.status(400).json({ message: 'Zipcode must be a number between 0 and 99999' });
  }
  if (unitCount && (typeof unitCount !== 'number' || unitCount < 0)) {
    return res.status(400).json({ message: 'Unit count must be a non-negative number' });
  }

  const property = await Property.findById(id).exec();
  if (!property) {
    return res.status(404).json({ message: `Property with ID ${id} not found` });
  }

  // Check for duplicate (excluding current property)
  const duplicate = await Property.findOne({ name, address, city, state })
    .collation({ locale: 'en', strength: 2 })
    .lean()
    .exec();
  if (duplicate && duplicate._id.toString() !== id) {
    return res.status(409).json({ message: `Property '${name}' at '${address}' already exists` });
  }

  property.name = name.trim();
  property.address = address.trim();
  property.city = city.trim();
  property.state = state.trim().toUpperCase();
  property.zipcode = zipcode;
  property.unitCount = unitCount;

  const updatedProperty = await property.save();
  res.status(200).json({
    message: `Property '${updatedProperty.name}' updated`,
    data: updatedProperty,
  });
});

// @desc Delete a property
// @route DELETE /properties
// @access Private
const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Validate input
  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Property ID is required' });
  }

  // Check for dependencies
  const dependencies = [
    { model: Expense, field: 'propertyID', message: 'expenses' },
    { model: Fine, field: 'propertyID', message: 'fines' },
    { model: Inspections, field: 'propertyID', message: 'inspections' },
    { model: Lease, field: 'propertyID', message: 'leases' },
    { model: Unit, field: 'propertyId', message: 'units' }, // Note: field name inconsistency
    { model: Utilities, field: 'propertyID', message: 'utilities' },
  ];

  for (const { model, field, message } of dependencies) {
    const exists = await model.findOne({ [field]: id }).lean().exec();
    if (exists) {
      return res.status(400).json({ message: `Property has assigned ${message}` });
    }
  }

  const property = await Property.findById(id).exec();
  if (!property) {
    return res.status(404).json({ message: `Property with ID ${id} not found` });
  }

  const { name, propertyId } = property;
  await property.deleteOne();

  res.status(200).json({
    message: `Property '${name}' with ID ${propertyId} deleted`,
  });
});

module.exports = {
  getAllProperties,
  createNewProperty,
  updateProperty,
  deleteProperty,
};