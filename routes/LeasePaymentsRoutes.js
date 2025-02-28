const express = require('express')
const router = express.Router()
const leasePaymentsController = require('../controllers/leasePaymentsController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(leasePaymentsController.getAllLeasePayments)
    .post(leasePaymentsController.createNewLeasePayment)
    .patch(leasePaymentsController.updateLeasePayment)
    .delete(leasePaymentsController.deleteLeasePayment)

module.exports = router