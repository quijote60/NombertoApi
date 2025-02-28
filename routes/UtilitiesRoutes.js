const express = require('express')
const router = express.Router()
const utilitiesController = require('../controllers/utilitiesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(utilitiesController.getAllUtilities)
    .post(utilitiesController.createNewUtility)
    .patch(utilitiesController.updateUtility)
    .delete(utilitiesController.deleteUtility)

module.exports = router