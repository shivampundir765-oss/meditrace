const express = require('express');
const router = express.Router();
const catalogController = require('../../controllers/catalog.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/', catalogController.listCatalogs);
router.post('/', catalogController.createCatalog);
router.put('/:id', catalogController.updateCatalog);
router.delete('/:id', catalogController.deleteCatalog);

router.post('/:id/medicines', catalogController.addMedicine);
router.delete('/:id/medicines/:medicineId', catalogController.removeMedicine);

module.exports = router;
