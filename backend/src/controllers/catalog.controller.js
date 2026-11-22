const catalogService = require('../services/catalog.service');

exports.listCatalogs = async (req, res, next) => {
  try {
    const data = await catalogService.listCatalogsWithMedicines(req.user._id);
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.createCatalog = async (req, res, next) => {
  try {
    const data = await catalogService.createCatalog(req.user._id, req.body);
    res.status(201).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCatalog = async (req, res, next) => {
  try {
    const data = await catalogService.updateCatalog(req.user._id, req.params.id, req.body);
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCatalog = async (req, res, next) => {
  try {
    await catalogService.deleteCatalog(req.user._id, req.params.id);
    res.json({
      status: 'success',
      message: 'Catalog deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.addMedicine = async (req, res, next) => {
  try {
    const data = await catalogService.addMedicine(req.user._id, req.params.id, req.body);
    res.status(201).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

exports.removeMedicine = async (req, res, next) => {
  try {
    await catalogService.removeMedicine(req.user._id, req.params.id, req.params.medicineId);
    res.json({
      status: 'success',
      message: 'Medicine removed from catalog'
    });
  } catch (error) {
    next(error);
  }
};
