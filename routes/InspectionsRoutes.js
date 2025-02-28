const express = require('express')
const router = express.Router()
const inspectionsController = require('../controllers/inspectionsController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(inspectionsController.getAllInspections)
    .post(inspectionsController.createNewInspection)
    .patch(inspectionsController.updateInspection)
    .delete(inspectionsController.deleteInspection)

module.exports = router