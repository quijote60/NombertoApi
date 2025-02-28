const express = require('express')
const router = express.Router()
const utilityTypesController = require('../controllers/utilityTypesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(utilityTypesController.getAllUtilityTypes)
    .post(utilityTypesController.createNewUtilityType)
    .patch(utilityTypesController.updateUtilityType)
    .delete(utilityTypesController.deleteUtilityType)

module.exports = router