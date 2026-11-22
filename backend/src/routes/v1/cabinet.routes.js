const express = require('express');
const cabinetController = require('../../controllers/cabinet.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { resolveProfile } = require('../../middleware/profile.middleware');

const router = express.Router();

router.use(authenticate);
router.use(resolveProfile);

router.route('/')
  .get(cabinetController.getCabinets)
  .post(cabinetController.createCabinet);

router.route('/:id')
  .get(cabinetController.getCabinetById)
  .put(cabinetController.updateCabinet)
  .delete(cabinetController.deleteCabinet);

router.route('/:id/medicines')
  .post(cabinetController.addMedicineToCabinet);

router.route('/:id/medicines/:medId')
  .delete(cabinetController.removeMedicineFromCabinet);

router.route('/:id/prescriptions')
  .post(cabinetController.addPrescriptionToCabinet);

module.exports = router;
