const express = require('express')
const router = express.Router()
const unitsController = require('../controllers/unitsController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(unitsController.getAllUnits)
    .post(unitsController.createNewUnit)
    .patch(unitsController.updateUnit)
    .delete(unitsController.deleteUnit)

module.exports = router