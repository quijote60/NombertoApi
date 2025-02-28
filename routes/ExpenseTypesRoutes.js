const express = require('express')
const router = express.Router()
const expenseTypesController = require('../controllers/expenseTypesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(expenseTypesController.getAllExpenseTypes)
    .post(expenseTypesController.createNewExpenseType)
    .patch(expenseTypesController.updateExpenseType)
    .delete(expenseTypesController.deleteExpenseType)

module.exports = router