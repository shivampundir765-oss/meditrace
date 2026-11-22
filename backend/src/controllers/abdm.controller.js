const abdmService = require('../services/abdm.service');
const ApiResponse = require('../utils/apiResponse');

const searchDrugs = async (req, res, next) => {
  try {
    const { query, limit } = req.query;
    const drugs = await abdmService.searchAbdmDrugs(query, {
      limit: limit ? parseInt(limit, 10) : 20
    });
    return ApiResponse.success(
      res,
      { drugs, total: drugs.length },
      'ABDM Drug Registry records retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getDrugByIdentifier = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const drug = await abdmService.lookupByCodeOrBarcode(identifier);
    if (!drug) {
      return ApiResponse.error(
        res,
        `No ABDM Drug Registry record found for identifier: ${identifier}`,
        404,
        'NOT_FOUND'
      );
    }
    return ApiResponse.success(
      res,
      { drug },
      'ABDM Drug Registry record verified'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchDrugs,
  getDrugByIdentifier
};
