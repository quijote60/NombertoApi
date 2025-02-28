
const mongoose = require('mongoose');
const Lease = require('../models/Lease');
const asyncHandler = require('express-async-handler');

const validateLeaseData = (data) => {
  const { leaseId, propertyId, unitId, leaseDate, monthlyRent, leaseStartDate, leaseEndDate, leaseTerm, securityDeposit, active } = data;

  const requiredFields = { leaseId, propertyId, unitId, leaseDate, monthlyRent };
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  if (typeof leaseId !== 'string' || leaseId.trim() === '') {
    return { valid: false, message: 'Lease ID must be a non-empty string' };
  }

  if (!mongoose.isValidObjectId(propertyId) || !mongoose.isValidObjectId(unitId)) {
    return { valid: false, message: 'Invalid ObjectId format for propertyId or unitId' };
  }

  const leaseDateObj = new Date(leaseDate);
  if (isNaN(leaseDateObj) || leaseDateObj > new Date()) {
    return { valid: false, message: 'Lease date must be a valid date and not in the future' };
  }

  const leaseStartDateObj = leaseStartDate ? new Date(leaseStartDate) : null;
  const leaseEndDateObj = leaseEndDate ? new Date(leaseEndDate) : null;
  if (leaseStartDateObj && leaseEndDateObj && leaseStartDateObj > leaseEndDateObj) {
    return { valid: false, message: 'Lease start date must be on or before lease end date' };
  }

  if (typeof monthlyRent !== 'number' || monthlyRent < 0) {
    return { valid: false, message: 'Monthly rent must be a non-negative number' };
  }

  if (leaseTerm !== undefined && (typeof leaseTerm !== 'number' || leaseTerm < 0)) {
    return { valid: false, message: 'Lease term must be a non-negative number' };
  }

  if (securityDeposit !== undefined && (typeof securityDeposit !== 'number' || securityDeposit < 0)) {
    return { valid: false, message: 'Security deposit must be a non-negative number' };
  }

  if (active !== undefined && typeof active !== 'boolean') {
    return { valid: false, message: 'Active must be a boolean' };
  }

  return {
    valid: true,
    leaseData: {
      leaseId: leaseId.trim(),
      propertyId,
      unitId,
      leaseDate: leaseDateObj,
      leaseStartDate: leaseStartDateObj || undefined,
      leaseEndDate: leaseEndDateObj || undefined,
      leaseTerm,
      monthlyRent,
      securityDeposit,
      active: active !== undefined ? active : true,
    },
  };
};

// @desc Get all leases
// @route GET /leases
// @access Private
const getAllLeases = asyncHandler(async (req, res) => {
  const leases = await Lease.find().lean();
  if (!leases?.length) {
    return res.status(404).json({ message: 'No leases found' });
  }
  res.status(200).json({ data: leases });
});

// @desc Create a new lease
// @route POST /leases
// @access Private
const createNewLease = asyncHandler(async (req, res) => {
    console.log("Incoming request body:", req.body); // Debug log
  
    const validation = validateLeaseData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
  
    try {
      const duplicate = await Lease.findOne({ leaseId: validation.leaseData.leaseId }).lean().exec();
      if (duplicate) {
        return res.status(409).json({ message: `Lease ID '${validation.leaseData.leaseId}' already exists` });
      }
  
      const lease = await Lease.create(validation.leaseData);
      res.status(201).json({
        message: `Lease '${lease.leaseId}' created`,
        data: lease,
      });
    } catch (error) {
      console.error("Error creating lease:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  });

// @desc Update a lease
// @route PATCH /leases
// @access Private
const updateLease = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Lease ID (_id) is required' });
  }

  const validation = validateLeaseData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const lease = await Lease.findById(id).exec();
  if (!lease) {
    return res.status(404).json({ message: `Lease with ID ${id} not found` });
  }

  const duplicate = await Lease.findOne({ leaseId: validation.leaseData.leaseId, _id: { $ne: id } }).lean().exec();
  if (duplicate) {
    return res.status(409).json({ message: `Lease ID '${validation.leaseData.leaseId}' already exists` });
  }

  Object.assign(lease, validation.leaseData);
  const updatedLease = await lease.save();
  res.status(200).json({
    message: `Lease '${updatedLease.leaseId}' updated`,
    data: updatedLease,
  });
});

// @desc Delete a lease
// @route DELETE /leases
// @access Private
const deleteLease = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Lease ID (_id) is required' });
  }

  const lease = await Lease.findById(id).exec();
  if (!lease) {
    return res.status(404).json({ message: `Lease with ID ${id} not found` });
  }

  const { leaseId } = lease;
  await lease.deleteOne();

  res.status(200).json({
    message: `Lease '${leaseId}' deleted`,
  });
});

module.exports = {
  getAllLeases,
  createNewLease,
  updateLease,
  deleteLease,
};