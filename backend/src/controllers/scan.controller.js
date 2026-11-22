const scanService = require('../services/scan.service');
const ApiResponse = require('../utils/apiResponse');

const scanTwoSided = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const scan = await scanService.processTwoSidedScan(req.user._id, profileId, {
      ...req.body,
      user_role: req.user.role
    });
    return ApiResponse.success(
      res,
      {
        scan,
        autofill: scan.autofill_data,
        detected_fields: scan.autofill_data,
        field_sources: scan.field_sources,
        quality_report: scan.quality_report
      },
      'Packaging photos processed and medicine attributes verified successfully',
      200
    );
  } catch (error) {
    next(error);
  }
};

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

const saveDraft = async (req, res, next) => {
  try {
    const profileId = req.profile_id || null;
    const draft = await scanService.saveScanDraft(req.user._id, profileId, req.body);
    return ApiResponse.success(res, { draft }, 'Scan draft saved successfully');
  } catch (error) {
    next(error);
  }
};

const getDraft = async (req, res, next) => {
  try {
    const draft = await scanService.getLatestDraft(req.user._id);
    const formatted = draft ? { ...draft, draft_data: draft.autofill_data } : null;
    return ApiResponse.success(res, { draft: formatted }, 'Latest scan draft retrieved');
  } catch (error) {
    next(error);
  }
};

const discardDraft = async (req, res, next) => {
  try {
    const result = await scanService.discardScanDraft(req.user._id);
    return ApiResponse.success(res, result, 'Scan draft discarded');
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
  scanTwoSided,
  scanImage,
  scanBarcode,
  saveDraft,
  getDraft,
  discardDraft,
  getScanHistory
};
