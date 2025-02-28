const ExpenseType = require('../models/ExpenseType')
const Expense = require('../models/Expense')




// @desc Get all users
// @route GET /users
// @access Private
const getAllExpenseTypes = async (req, res) => {
    // Get all users from MongoDB
    const expensetypes = await ExpenseType.find().lean()

    // If no users 
    if (!expensetypes?.length) {
        return res.status(400).json({ message: 'No expense type found' })
    }

    res.json(expensetypes)
}

// @desc Create new user
// @route POST /users
// @access Private
const createNewExpenseType = async (req, res) => {
    const { expenseType, description  } = req.body

    // Confirm data
    if (!expenseType ) {
        return res.status(400).json({ message: 'All fields are required' })
    }

   

    // Check for duplicate username
    const duplicate = await ExpenseType.findOne({ expenseType }).collation({locale:'en', strength:2}).lean().exec()

    // Check for duplicate category_name

    

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate expense type' })
    }

    

    const expenseTypeObject = { expenseType,  }

    // Create and store new user 
    const expensetype = await ExpenseType.create(expenseTypeObject)

    if (expensetype) { //created 
        res.status(201).json({ message: `New expense type ${expenseType} created` })
    } else {
        res.status(400).json({ message: 'Invalid expense type data received' })
    }
}

// @desc Update a user
// @route PATCH /users
// @access Private
const updateExpenseType = async (req, res) => {
    const { id, expenseType  } = req.body

    // Confirm data 
    if (!id || !expenseType ) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Does the user exist to update?
    const expensetype = await ExpenseType.findById(id).exec()

    if (!expensetype) {
        return res.status(400).json({ message: 'Expense type not found' })
    }

    // Check for duplicate 
    const duplicate = await ExpenseType.findOne({ expenseType }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate expense type' })
    }

    
    expensetype.expenseType = expenseType
    

    

    const updateExpenseType = await expensetype.save()

    res.json({ message: `${updateExpenseType.expenseType} updated` })
}

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteExpenseType = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Expense type ID Required' })
    }

    // Does the category still shows in contributions?
    const expense = await Expense.findOne({ expenseType: id }).lean().exec()
    if (expense) {
        return res.status(400).json({ message: 'Expense type shows in Expenses' })
    }

    // Does the user exist to delete?
    const expenseType = await ExpenseType.findById(id).exec()

    if (!expenseType) {
        return res.status(400).json({ message: 'Expense type not found' })
    }

    const expensetype = expenseType.expenseType
    const expensetypeid = expenseType.id
    

    await expenseType.deleteOne()

    const reply = `Expense type  ${expensetype} with ID ${expensetypeid} deleted`

    res.json(reply)
}

module.exports = {
    getAllExpenseTypes,
    createNewExpenseType,
    updateExpenseType,
    deleteExpenseType
}