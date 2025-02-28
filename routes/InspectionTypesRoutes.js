const express = require('express')
const router = express.Router()
const inspectionTypesController = require('../controllers/inspectionTypesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(inspectionTypesController.getAllInspectionTypes)
    .post(inspectionTypesController.createNewInspectionType)
    .patch(inspectionTypesController.updateInspectionType)
    .delete(inspectionTypesController.deleteInspectionType)

module.exports = router