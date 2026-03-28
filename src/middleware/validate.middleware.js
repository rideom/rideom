// Reusable middleware — validates coords exist in query
function validateCoordsQuery(req, res, next) {
  const { fromLat, fromLng, toLat, toLng } = req.query;

  if (!fromLat || !fromLng || !toLat || !toLng) {
    return res.status(400).json({
      success: false,
      message: "fromLat, fromLng, toLat, toLng are all required query params",
    });
  }

  const values = [fromLat, fromLng, toLat, toLng].map(parseFloat);
  if (values.some(isNaN)) {
    return res.status(400).json({
      success: false,
      message: "All coordinates must be valid numbers",
    });
  }

  next();
}

module.exports = { validateCoordsQuery };