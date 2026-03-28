const express = require("express");
const { getAll, getByType } = require("../controller/fare.controller");
const { validateCoordsQuery } = require("../middleware/validate.middleware");

const router = express.Router();

// GET /api/fare/estimate          → all ride types
// GET /api/fare/estimate/:rideType → single ride type
router.get("/estimate", validateCoordsQuery, getAll);
router.get("/estimate/:rideType", validateCoordsQuery, getByType);

module.exports = router;
