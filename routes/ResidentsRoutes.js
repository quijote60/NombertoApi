const express = require('express')
const router = express.Router()
const residentsController = require('../controllers/residentsController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(residentsController.getAllResidents)
    .post(residentsController.createNewResident)
    .patch(residentsController.updateResident)
    .delete(residentsController.deleteResident)

module.exports = router