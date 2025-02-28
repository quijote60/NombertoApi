const express = require('express')
const router = express.Router()
const paymentCategoriesController = require('../controllers/paymentCategoriesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(paymentCategoriesController.getAllPaymentCategories)
    .post(paymentCategoriesController.createNewPaymentCategory)
    .patch(paymentCategoriesController.updatePaymentCategory)
    .delete(paymentCategoriesController.deletePaymentCategory)

module.exports = router