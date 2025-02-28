const express = require('express')
const router = express.Router()
const leasesController = require('../controllers/leasesController')
//const verifyJWT = require('../middleware/verifyJWT')

//router.use(verifyJWT)

router.route('/')
    .get(leasesController.getAllLeases)
    .post(leasesController.createNewLease)
    .patch(leasesController.updateLease)
    .delete(leasesController.deleteLease)

module.exports = router