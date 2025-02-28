const express = require('express')
const router = express.Router()
const propertiesController = require('../controllers/propertiesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(propertiesController.getAllProperties)
    .post(propertiesController.createNewProperty)
    .patch(propertiesController.updateProperty)
    .delete(propertiesController.deleteProperty)

module.exports = router