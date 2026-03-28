const fareService = require("../services/fare.service");

// GET /api/fare/estimate
const getAll = async (req, res, next) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    const result = fareService.getAllEstimates(
      parseFloat(fromLat),
      parseFloat(fromLng),
      parseFloat(toLat),
      parseFloat(toLng),
    );

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};


// GET /api/fare/estimate/:rideType
const getByType = async (req, res, next) => {
  try {
    const { rideType } = req.params;
    const { fromLat, fromLng, toLat, toLng } = req.query;

    const result = fareService.getEstimateByType(
      rideType,
      parseFloat(fromLat),
      parseFloat(fromLng),
      parseFloat(toLat),
      parseFloat(toLng),
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `Ride type "${rideType}" not found. Valid types: bike, auto, cab, rikshwa`,
      });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getByType };
