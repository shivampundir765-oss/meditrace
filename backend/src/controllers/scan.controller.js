const scanService = require('../services/scan.service');
const ApiResponse = require('../utils/apiResponse');

const scanImage = async (req, res, next) => {
  try {
    const scan = await scanService.processOcrScan(req.user._id, req.body);
    return ApiResponse.success(
      res,
      { scan, autofill: scan.autofill_data },
      'Image scan processed and medicine details extracted successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

const scanBarcode = async (req, res, next) => {
  try {
    const scan = await scanService.processBarcodeScan(req.user._id, req.body.barcode);
    return ApiResponse.success(
      res,
      { scan, autofill: scan.autofill_data },
      'Barcode scan matched and medicine details retrieved successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

const getScanHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await scanService.getScanHistory(req.user._id, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });
    return ApiResponse.success(res, result, 'Scan history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scanImage,
  scanBarcode,
  getScanHistory
};
