const express = require('express')
const router = express.Router()
const fineTypesController = require('../controllers/fineTypesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(fineTypesController.getAllFineTypes)
    .post(fineTypesController.createNewFineType)
    .patch(fineTypesController.updateFineType)
    .delete(fineTypesController.deleteFineType)

module.exports = router