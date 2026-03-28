const FARE_CONFIG = {
  bike: {
    baseFare:        15,
    perKm:           8,
    perMin:          0.5,
    minFare:         25,
    surgeMultiplier: 1.0,
  },
  auto: {
    baseFare:        25,
    perKm:           12,
    perMin:          0.8,
    minFare:         50,
    surgeMultiplier: 1.0,
  },
  cab: {
    baseFare:        50,
    perKm:           18,
    perMin:          1.2,
    minFare:         100,
    surgeMultiplier: 1.0,
  },
  rikshwa: {
    baseFare:        20,
    perKm:           10,
    perMin:          0.6,
    minFare:         40,
    surgeMultiplier: 1.0,
  },
};

// Average city speed per vehicle type (km/h)
const AVG_SPEED_KMPH = {
  bike:    35,
  auto:    25,
  cab:     30,
  rikshwa: 20,
};

module.exports = { FARE_CONFIG, AVG_SPEED_KMPH };