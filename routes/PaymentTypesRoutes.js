const express = require('express')
const router = express.Router()
const paymentTypesController = require('../controllers/paymentTypesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(paymentTypesController.getAllPaymentTypes)
    .post(paymentTypesController.createNewPaymentType)
    .patch(paymentTypesController.updatePaymentType)
    .delete(paymentTypesController.deletePaymentType)

module.exports = router