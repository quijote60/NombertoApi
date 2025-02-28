const express = require('express')
const router = express.Router()
const finesController = require('../controllers/finesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(finesController.getAllFines)
    .post(finesController.createNewFine)
    .patch(finesController.updateFine)
    .delete(finesController.deleteFine)

module.exports = router