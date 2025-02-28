const mongoose = require('mongoose');

// Generic validation helper for required fields
const checkRequiredFields = (data, requiredFields) => {
  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => value === undefined || value === null)
    .map(([key]) => key);
  if (missingFields.length > 0) {
    return { valid: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }
  return { valid: true };
};

// Common field validators
const validateString = (value, fieldName, required = false) => {
  if (required && (value === undefined || value === null)) {
    return { valid: false, message: `${fieldName} is required` };
  }
  if (value && (typeof value !== 'string' || value.trim() === '')) {
    return { valid: false, message: `${fieldName} must be a non-empty string` };
  }
  return { valid: true, value: value ? value.trim() : undefined };
};

const validateObjectId = (value, fieldName, required = true) => {
  if (required && (value === undefined || value === null)) {
    return { valid: false, message: `${fieldName} is required` };
  }
  if (value && !mongoose.isValidObjectId(value)) {
    return { valid: false, message: `Invalid ObjectId format for ${fieldName}` };
  }
  return { valid: true, value };
};

const validateDate = (value, fieldName, required = false, allowFuture = false, minDate = null, maxDate = null) => {
    if (required && !value) {
      return { valid: false, message: `${fieldName} is required` };
    }
  
    const dateObj = value ? new Date(value) : null;
    if (dateObj && isNaN(dateObj)) {
      return { valid: false, message: `${fieldName} must be a valid date` };
    }
  
    if (dateObj && allowFuture === false && dateObj > new Date()) {
      return { valid: false, message: `${fieldName} cannot be in the future` };
    }
  
    if (dateObj && minDate && dateObj < minDate) {
      return { valid: false, message: `${fieldName} must be on or after ${minDate.toISOString().split('T')[0]}` };
    }
  
    if (dateObj && maxDate && dateObj > maxDate) {
      return { valid: false, message: `${fieldName} must be on or before ${maxDate.toISOString().split('T')[0]}` };
    }
  
    return { valid: true, value: dateObj || undefined };
  };    

const validateNumber = (value, fieldName, required = false, min = 0) => {
  if (required && (value === undefined || value === null)) {
    return { valid: false, message: `${fieldName} is required` };
  }
  if (value !== undefined && (typeof value !== 'number' || value < min)) {
    return { valid: false, message: `${fieldName} must be a number >= ${min}` };
  }
  return { valid: true, value };
};

const validateBoolean = (value, fieldName, required = false) => {
  if (required && value === undefined) {
    return { valid: false, message: `${fieldName} is required` };
  }
  if (value !== undefined && typeof value !== 'boolean') {
    return { valid: false, message: `${fieldName} must be a boolean` };
  }
  return { valid: true, value };
};

const validateEmail = (value) => {
  if (value && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)) {
    return { valid: false, message: 'Email must be a valid email address' };
  }
  return { valid: true, value: value ? value.trim().toLowerCase() : undefined };
};

const validatePhone = (value, fieldName) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (value && !phoneRegex.test(value)) {
    return { valid: false, message: `${fieldName} must be a valid phone number (e.g., +12025550123)` };
  }
  return { valid: true, value: value ? value.trim() : undefined };
};

// Model-specific validators
const validateResidentData = (data, isUpdate = false) => {
  const { firstName, lastName, email, mobileNumber, homeNumber, notes, active } = data;

  const validations = [
    validateString(firstName, 'First name', true),
    validateString(lastName, 'Last name', true),
    validateEmail(email),
    validatePhone(mobileNumber, 'Mobile number'),
    validatePhone(homeNumber, 'Home number'),
    validateString(notes, 'Notes'),
    validateBoolean(active, 'Active', isUpdate),
  ];

  for (const result of validations) {
    if (!result.valid) return result;
  }

  return {
    valid: true,
    residentData: {
      firstName: validations[0].value,
      lastName: validations[1].value,
      email: validations[2].value,
      mobileNumber: validations[3].value,
      homeNumber: validations[4].value,
      notes: validations[5].value,
      ...(isUpdate && active !== undefined && { active: validations[6].value }),
    },
  };
};

const validateLeasePaymentData = (data) => {
  const { leaseId, paymentType, paymentCategory, paymentDate, paymentAmount, notes, paymentDueDate } = data;

  const validations = [
    validateString(leaseId, 'Lease ID', true),
    validateObjectId(paymentType, 'Payment type', true),
    validateObjectId(paymentCategory, 'Payment category', true),
    validateDate(paymentDate, 'Payment date', true),
    validateNumber(paymentAmount, 'Payment amount', true, 0),
    validateString(notes, 'Notes'),
    validateDate(paymentDueDate, 'Payment due date', false, null), // No future restriction, just valid date
  ];

  for (const result of validations) {
    if (!result.valid) return result;
  }

  if (validations[6].value && validations[6].value < validations[3].value) {
    return { valid: false, message: 'Payment due date must be on or after payment date' };
  }

  return {
    valid: true,
    leasePaymentData: {
      leaseId: validations[0].value,
      paymentType: validations[1].value,
      paymentCategory: validations[2].value,
      paymentDate: validations[3].value,
      paymentAmount: validations[4].value,
      notes: validations[5].value,
      paymentDueDate: validations[6].value,
    },
  };
};

const validateUtilityData = (data) => {
  const { propertyId, utilityTypeId, paymentDate, amount, paymentType, paymentCategory, readingDate, meterReading, checkNumber } = data;

  const validations = [
    validateObjectId(propertyId, 'Property ID', true),
    validateObjectId(utilityTypeId, 'Utility type ID', true),
    validateDate(paymentDate, 'Payment date', true),
    validateNumber(amount, 'Amount', true, 0),
    validateObjectId(paymentType, 'Payment type', true),
    validateObjectId(paymentCategory, 'Payment category', true),
    validateDate(readingDate, 'Reading date'),
    validateNumber(meterReading, 'Meter reading', false, 0),
    validateNumber(checkNumber, 'Check number', false, 0),
  ];

  for (const result of validations) {
    if (!result.valid) return result;
  }

  if (validations[6].value && validations[6].value > validations[2].value) {
    return { valid: false, message: 'Reading date cannot be after payment date' };
  }

  return {
    valid: true,
    utilityData: {
      propertyId: validations[0].value,
      utilityTypeId: validations[1].value,
      paymentDate: validations[2].value,
      amount: validations[3].value,
      paymentType: validations[4].value,
      paymentCategory: validations[5].value,
      readingDate: validations[6].value,
      meterReading: validations[7].value,
      checkNumber: validations[8].value,
    },
  };
};

const validateExpenseData = (data) => {
  const { propertyId, expenseDate, expenseAmount, paymentCategory, paymentType, notes, checkNumber } = data;

  const validations = [
    validateObjectId(propertyId, 'Property ID', true),
    validateDate(expenseDate, 'Expense date', true),
    validateNumber(expenseAmount, 'Expense amount', true, 0),
    validateObjectId(paymentCategory, 'Payment category', true),
    validateObjectId(paymentType, 'Payment type', true),
    validateString(notes, 'Notes'),
    validateNumber(checkNumber, 'Check number', false, 0),
  ];

  for (const result of validations) {
    if (!result.valid) return result;
  }

  return {
    valid: true,
    expenseData: {
      propertyId: validations[0].value,
      expenseDate: validations[1].value,
      expenseAmount: validations[2].value,
      paymentCategory: validations[3].value,
      paymentType: validations[4].value,
      notes: validations[5].value,
      checkNumber: validations[6].value,
    },
  };
};

const validateFineData = (data) => {
    const { fineId, propertyId, fineType, fineDate, fineDueDate, fineAmount, paymentType, checkNumber } = data;
  
    const validations = [
      validateString(fineId, 'Fine ID', true),
      validateObjectId(propertyId, 'Property ID', true),
      validateObjectId(fineType, 'Fine type', true),
      validateDate(fineDate, 'Fine date', true, false), // Disallow future dates for fineDate
      validateDate(fineDueDate, 'Fine due date', true, true), // Allow future dates for fineDueDate
      validateNumber(fineAmount, 'Fine amount', true, 0),
      validateObjectId(paymentType, 'Payment type', true),
      validateNumber(checkNumber, 'Check number', false, 0),
    ];
  
    for (const result of validations) {
      if (!result.valid) return result;
    }
  
    // Ensure fineDueDate is on or after fineDate
    if (validations[4].value < validations[3].value) {
      return { valid: false, message: 'Fine due date must be on or after fine date' };
    }
  
    return {
      valid: true,
      fineData: {
        fineId: validations[0].value,
        propertyId: validations[1].value,
        fineType: validations[2].value,
        fineDate: validations[3].value,
        fineDueDate: validations[4].value,
        fineAmount: validations[5].value,
        paymentType: validations[6].value,
        checkNumber: validations[7].value,
        notes: data.notes ? data.notes.trim() : undefined,
      },
    };
  };

const validateInspectionData = (data) => {
  const { propertyId, inspectionTypeId, inspectionDate, inspectedBy, inspectionAmount, paymentType, checkNumber } = data;

  const validations = [
    validateObjectId(propertyId, 'Property ID', true),
    validateObjectId(inspectionTypeId, 'Inspection type ID', true),
    validateDate(inspectionDate, 'Inspection date', true),
    validateString(inspectedBy, 'Inspected by', true),
    validateNumber(inspectionAmount, 'Inspection amount', true, 0),
    validateObjectId(paymentType, 'Payment type', true),
    validateNumber(checkNumber, 'Check number', false, 0),
  ];

  for (const result of validations) {
    if (!result.valid) return result;
  }

  return {
    valid: true,
    inspectionData: {
      propertyId: validations[0].value,
      inspectionTypeId: validations[1].value,
      inspectionDate: validations[2].value,
      inspectedBy: validations[3].value,
      inspectionAmount: validations[4].value,
      paymentType: validations[5].value,
      checkNumber: validations[6].value,
      notes: data.notes ? data.notes.trim() : undefined,
    },
  };
};

const validateLeaseData = (data) => {
  const { leaseId, propertyId, unitId, leaseDate, monthlyRent, leaseStartDate, leaseEndDate, leaseTerm, securityDeposit, active } = data;

  const validations = [
    validateString(leaseId, 'Lease ID', true),
    validateObjectId(propertyId, 'Property ID', true),
    validateObjectId(unitId, 'Unit ID', true),
    validateDate(leaseDate, 'Lease date', true),
    validateNumber(monthlyRent, 'Monthly rent', true, 0),
    validateDate(leaseStartDate, 'Lease start date'),
    validateDate(leaseEndDate, 'Lease end date'),
    validateNumber(leaseTerm, 'Lease term', false, 0),
    validateNumber(securityDeposit, 'Security deposit', false, 0),
    validateBoolean(active, 'Active'),
  ];

  for (const result of validations) {
    if (!result.valid) return result;
  }

  if (validations[5].value && validations[6].value && validations[5].value > validations[6].value) {
    return { valid: false, message: 'Lease start date must be on or before lease end date' };
  }

  return {
    valid: true,
    leaseData: {
      leaseId: validations[0].value,
      propertyId: validations[1].value,
      unitId: validations[2].value,
      leaseDate: validations[3].value,
      monthlyRent: validations[4].value,
      leaseStartDate: validations[5].value,
      leaseEndDate: validations[6].value,
      leaseTerm: validations[7].value,
      securityDeposit: validations[8].value,
      active: validations[9].value !== undefined ? validations[9].value : true,
    },
  };
};

const validateUnitData = (data) => {
  const { unitNumber, propertyId, rented, bedrooms, bathrooms, notes } = data;

  const validations = [
    validateString(unitNumber, 'Unit number', true),
    validateObjectId(propertyId, 'Property ID', true),
    validateBoolean(rented, 'Rented', true),
    validateNumber(bedrooms, 'Bedrooms', false, 0, 20),
    validateNumber(bathrooms, 'Bathrooms', false, 0, 20),
    validateString(notes, 'Notes'),
  ];

  for (const result of validations) {
    if (!result.valid) return result;
  }

  return {
    valid: true,
    unitData: {
      unitNumber: validations[0].value,
      propertyId: validations[1].value,
      rented: validations[2].value,
      bedrooms: validations[3].value,
      bathrooms: validations[4].value,
      notes: validations[5].value,
    },
  };
};

module.exports = {
  validateResidentData,
  validateLeasePaymentData,
  validateUtilityData,
  validateExpenseData,
  validateFineData,
  validateInspectionData,
  validateLeaseData,
  validateUnitData,
};