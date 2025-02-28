const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const {validateExpenseData} = require('../utils/validation');
const asyncHandler = require('express-async-handler');

// Validation function


// @desc Get all expenses
// @route GET /expenses
// @access Private
const getAllExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find().lean();
  if (!expenses?.length) {
    return res.status(404).json({ message: 'No expenses found' });
  }
  res.status(200).json({ data: expenses });
});

// @desc Create a new expense
// @route POST /expenses
// @access Private
const createNewExpense = asyncHandler(async (req, res) => {
    const validation = validateExpenseData(req.body);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }
  const duplicate = await Expense.findOne({
    propertyId: validation.expenseData.propertyId,
    expenseDate: validation.expenseData.expenseDate,
    paymentCategory: validation.expenseData.paymentCategory,
    paymentType: validation.expenseData.paymentType,
    expenseAmount: validation.expenseData.expenseAmount,
  }).lean().exec();
  if (duplicate) {
    return res.status(409).json({
      message: `An expense with ID ${duplicate.expenseId} already exists for this property, date, category, type, and amount`,
    });
  }

  const expense = await Expense.create(validation.expenseData);
  res.status(201).json({
    message: `Expense ${expense.expenseId} created`,
    data: expense,
  });
});

// @desc Update an expense
// @route PATCH /expenses
// @access Private
const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Expense ID (_id) is required' });
  }

  const validation = validateExpenseData(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const expense = await Expense.findById(id).exec();
  if (!expense) {
    return res.status(404).json({ message: `Expense with ID ${id} not found` });
  }
  const duplicate = await Expense.findOne({
    propertyId: validation.expenseData.propertyId,
    expenseDate: validation.expenseData.expenseDate,
    paymentCategory: validation.expenseData.paymentCategory,
    paymentType: validation.expenseData.paymentType,
    expenseAmount: validation.expenseData.expenseAmount,
    _id: { $ne: id }, // Exclude the current record
  }).lean().exec();

  if (duplicate) {
    return res.status(409).json({
      message: `An expense with ID ${duplicate.expenseId} already exists for this property, date, category, type, and amount`,
    });
  }

  Object.assign(expense, validation.expenseData);
  const updatedExpense = await expense.save();
  res.status(200).json({
    message: `Expense ${updatedExpense.expenseId} updated`,
    data: updatedExpense,
  });
});

// @desc Delete an expense
// @route DELETE /expenses
// @access Private
const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Valid Expense ID (_id) is required' });
  }

  const expense = await Expense.findById(id).exec();
  if (!expense) {
    return res.status(404).json({ message: `Expense with ID ${id} not found` });
  }

  const { expenseId } = expense;
  await expense.deleteOne();

  res.status(200).json({
    message: `Expense ${expenseId} deleted`,
  });
});

module.exports = {
  getAllExpenses,
  createNewExpense,
  updateExpense,
  deleteExpense,
};