// const express = require("express");
// const router = express.Router();
// const { PrismaClient } = require("@prisma/client");
// const { getDistance } = require("geolib");
// const { sendPushNotification } = require("../helpers/push.helpers");
// const { calculateFareEstimates } = require("../helpers/fare.helpers");
// const { emitToUser } = require("../../server");

// const prisma = new PrismaClient();

// // ─────────────────────────────────────────
// // GET /api/rides/fare-estimate
// // Query: fromLat, fromLng, toLat, toLng
// // ─────────────────────────────────────────
// router.get("/fare-estimate", async (req, res) => {
//   try {
//     const { fromLat, fromLng, toLat, toLng } = req.query;

//     if (!fromLat || !fromLng || !toLat || !toLng) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Missing coordinates" });
//     }

//     const { estimates } = calculateFareEstimates({
//       fromLat,
//       fromLng,
//       toLat,
//       toLng,
//     });

//     return res.json({ success: true, data: { estimates } });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // GET /api/rides/nearby-drivers
// // Query: lat, lng, vehicleType, radiusKm
// // ─────────────────────────────────────────
// router.get("/nearby-drivers", async (req, res) => {
//   try {
//     const { lat, lng, vehicleType, radiusKm = 10 } = req.query;

//     if (!lat || !lng || !vehicleType) {
//       return res.status(400).json({ success: false, error: "Missing params" });
//     }

//     const drivers = await prisma.driver.findMany({
//       where: {
//         isOnline: true,
//         isVerified: true,
//         vehicleType: vehicleType.toUpperCase(),
//         location: { isNot: null },
//       },
//       include: {
//         user: {
//           select: { id: true, name: true, phone: true ,pushToken: true},
//         },
//         location: true,
//       },
//     });

//     console.log("nearby drivers",drivers)

//     const nearby = drivers
//       .map((driver) => {
//         const distMeters = getDistance(
//           { latitude: parseFloat(lat), longitude: parseFloat(lng) },
//           { latitude: driver.location.lat, longitude: driver.location.lng },
//         );
//         return {
//           ...driver,
//           distanceKm: parseFloat((distMeters / 1000).toFixed(1)),
//         };
//       })
//       .filter((d) => d.distanceKm <= parseFloat(radiusKm))
//       .sort((a, b) => a.distanceKm - b.distanceKm);

//     return res.json({ success: true, data: { drivers: nearby } });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // POST /api/rides/book
// // Body: customerId, driverId, vehicleType,
// //       pickupLat, pickupLng, pickupAddress,
// //       dropLat, dropLng, dropAddress,
// //       fare, distanceKm, durationMin
// // ─────────────────────────────────────────
// router.post("/book", async (req, res) => {
//   try {
//     const {
//       customerId,
//       driverId,
//       vehicleType,
//       pickupLat,
//       pickupLng,
//       pickupAddress,
//       dropLat,
//       dropLng,
//       dropAddress,
//       fare,
//       distanceKm,
//       durationMin,
//     } = req.body;

//     // Validate required fields
//     if (
//       !customerId ||
//       !driverId ||
//       !vehicleType ||
//       !pickupLat ||
//       !pickupLng ||
//       !pickupAddress ||
//       !dropLat ||
//       !dropLng ||
//       !dropAddress ||
//       !fare
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Missing required fields" });
//     }

//     // Check driver is still online and available
//     const driver = await prisma.driver.findFirst({
//       where: { id: parseInt(driverId), isOnline: true, isVerified: true },
//       include: {
//         user: {
//           select: { id: true, name: true, phone: true, pushToken: true },
//         },
//       },
//     });

//     if (!driver) {
//       return res.status(400).json({
//         success: false,
//         error: "Driver is no longer available. Please select another.",
//       });
//     }

//     // Check no active ride exists for this driver
//     const activeRide = await prisma.ride.findFirst({
//       where: {
//         driverId: driver.id,
//         status: { in: ["PENDING", "ACCEPTED", "DRIVER_ARRIVED", "ONGOING"] },
//       },
//     });

//     if (activeRide) {
//       return res.status(400).json({
//         success: false,
//         error: "Driver already has an active ride.",
//       });
//     }

//     // Generate 4-digit OTP
//     const otp = Math.floor(1000 + Math.random() * 9000).toString();

//     // Create ride
//     const ride = await prisma.ride.create({
//       data: {
//         customerId: parseInt(customerId),
//         driverId: driver.id,
//         vehicleType: vehicleType.toUpperCase(),
//         pickupLat: parseFloat(pickupLat),
//         pickupLng: parseFloat(pickupLng),
//         pickupAddress,
//         dropLat: parseFloat(dropLat),
//         dropLng: parseFloat(dropLng),
//         dropAddress,
//         fare: parseFloat(fare),
//         distanceKm: parseFloat(distanceKm),
//         durationMin: parseInt(durationMin),
//         otp,
//         status: "PENDING",
//       },
//       include: {
//         customer: { select: { id: true, name: true, phone: true } },
//         driver: {
//           include: {
//             user: {
//               select: { id: true, name: true, phone: true, pushToken: true },
//             },
//           },
//         },
//       },
//     });

//     // Emit new ride request to driver via Socket.io
//     emitToUser(driver.userId, "new_ride_request", ride);

//     // Send push notification to driver
//     await sendPushNotification({
//       pushToken: driver.user.pushToken,
//       title: "🚗 New Ride Request!",
//       body: `₹${fare} · ${pickupAddress} → ${dropAddress}`,
//       data: { rideId: ride.id, type: "NEW_RIDE" },
//     });

//     return res.json({ success: true, data: { ride } });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // PATCH /api/rides/:id/accept
// // ─────────────────────────────────────────
// router.patch("/:id/accept", async (req, res) => {
//   try {
//     const rideId = parseInt(req.params.id);

//     const ride = await prisma.ride.findUnique({ where: { id: rideId } });
//     if (!ride)
//       return res.status(404).json({ success: false, error: "Ride not found" });
//     if (ride.status !== "PENDING") {
//       return res
//         .status(400)
//         .json({ success: false, error: "Ride is no longer pending" });
//     }

//     const updated = await prisma.ride.update({
//       where: { id: rideId },
//       data: { status: "ACCEPTED", acceptedAt: new Date() },
//       include: {
//         customer: { select: { id: true, pushToken: true } },
//         driver: {
//           include: {
//             user: { select: { id: true, name: true } },
//           },
//         },
//       },
//     });

//     // Notify customer
//     emitToUser(updated.customerId, "ride_status_update", updated);
//     await sendPushNotification({
//       pushToken: updated.customer.pushToken,
//       title: "✅ Driver Accepted!",
//       body: `${updated.driver.user.name} is on the way to pick you up.`,
//       data: { rideId: updated.id, status: "ACCEPTED" },
//     });

//     return res.json({ success: true, data: { ride: updated } });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // PATCH /api/rides/:id/arrived
// // ─────────────────────────────────────────
// router.patch("/:id/arrived", async (req, res) => {
//   try {
//     const rideId = parseInt(req.params.id);

//     const updated = await prisma.ride.update({
//       where: { id: rideId },
//       data: { status: "DRIVER_ARRIVED", arrivedAt: new Date() },
//       include: {
//         customer: { select: { id: true, pushToken: true } },
//       },
//     });

//     emitToUser(updated.customerId, "ride_status_update", updated);
//     await sendPushNotification({
//       pushToken: updated.customer.pushToken,
//       title: "📍 Driver Has Arrived!",
//       body: "Your driver is waiting. Share OTP to start the ride.",
//       data: { rideId: updated.id, status: "DRIVER_ARRIVED" },
//     });

//     return res.json({ success: true, data: { ride: updated } });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // PATCH /api/rides/:id/start
// // Body: enteredOtp
// // ─────────────────────────────────────────
// router.patch("/:id/start", async (req, res) => {
//   try {
//     const rideId = parseInt(req.params.id);
//     const { enteredOtp } = req.body;

//     if (!enteredOtp) {
//       return res.status(400).json({ success: false, error: "OTP is required" });
//     }

//     const ride = await prisma.ride.findUnique({ where: { id: rideId } });
//     if (!ride)
//       return res.status(404).json({ success: false, error: "Ride not found" });
//     if (ride.otp !== String(enteredOtp)) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Wrong OTP. Please try again." });
//     }

//     const updated = await prisma.ride.update({
//       where: { id: rideId },
//       data: { status: "ONGOING", startedAt: new Date() },
//       include: {
//         customer: { select: { id: true, pushToken: true } },
//       },
//     });

//     emitToUser(updated.customerId, "ride_status_update", updated);

//     return res.json({ success: true, data: { ride: updated } });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // PATCH /api/rides/:id/complete
// // ─────────────────────────────────────────
// router.patch("/:id/complete", async (req, res) => {
//   try {
//     const rideId = parseInt(req.params.id);

//     const ride = await prisma.ride.findUnique({
//       where: { id: rideId },
//       include: { driver: true },
//     });
//     if (!ride)
//       return res.status(404).json({ success: false, error: "Ride not found" });

//     // Update ride status
//     const updated = await prisma.ride.update({
//       where: { id: rideId },
//       data: { status: "COMPLETED", completedAt: new Date() },
//       include: {
//         customer: { select: { id: true, pushToken: true } },
//         driver: true,
//       },
//     });

//     const driverEarning = parseFloat((ride.fare * 0.85).toFixed(2));

//     // Create earning record
//     await prisma.driverEarning.create({
//       data: {
//         driverId: ride.driverId,
//         amount: driverEarning,
//         type: "RIDE",
//         status: "PENDING",
//         description: `Ride #${ride.id} · ${ride.pickupAddress} → ${ride.dropAddress}`,
//         rideId: ride.id,
//       },
//     });

//     // Update driver stats and wallet
//     await prisma.driver.update({
//       where: { id: ride.driverId },
//       data: {
//         totalRides: { increment: 1 },
//         walletBalance: { increment: driverEarning },
//         lastSeenAt: new Date(),
//       },
//     });

//     // Notify customer
//     emitToUser(updated.customerId, "ride_status_update", updated);
//     await sendPushNotification({
//       pushToken: updated.customer.pushToken,
//       title: "🎉 Ride Completed!",
//       body: `You reached ${ride.dropAddress}. Fare: ₹${ride.fare}`,
//       data: { rideId: updated.id, status: "COMPLETED" },
//     });

//     return res.json({ success: true, data: { ride: updated, driverEarning } });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // PATCH /api/rides/:id/cancel
// // Body: reason, cancelledBy ('customer' | 'driver')
// // ─────────────────────────────────────────
// router.patch("/:id/cancel", async (req, res) => {
//   try {
//     const rideId = parseInt(req.params.id);
//     const { reason = "No reason provided", cancelledBy = "customer" } =
//       req.body;

//     const updated = await prisma.ride.update({
//       where: { id: rideId },
//       data: {
//         status: "CANCELLED",
//         cancelledAt: new Date(),
//         cancelReason: reason,
//         cancelledBy,
//       },
//       include: {
//         customer: { select: { id: true, pushToken: true } },
//         driver: {
//           include: {
//             user: { select: { id: true, pushToken: true } },
//           },
//         },
//       },
//     });

//     if (cancelledBy === "customer") {
//       // Notify driver
//       emitToUser(updated.driver.userId, "ride_status_update", updated);
//       await sendPushNotification({
//         pushToken: updated.driver.user.pushToken,
//         title: "❌ Ride Cancelled",
//         body: "Customer cancelled the ride.",
//         data: { rideId: updated.id, status: "CANCELLED" },
//       });
//     } else {
//       // Notify customer
//       emitToUser(updated.customerId, "ride_status_update", updated);
//       await sendPushNotification({
//         pushToken: updated.customer.pushToken,
//         title: "❌ Ride Cancelled",
//         body: "Driver cancelled. Please try booking again.",
//         data: { rideId: updated.id, status: "CANCELLED" },
//       });
//     }

//     return res.json({ success: true, data: { ride: updated } });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // PATCH /api/rides/driver/location
// // Body: driverId, lat, lng, heading, speed
// // Called every 5s from driver app
// // ─────────────────────────────────────────
// router.patch("/driver/location", async (req, res) => {
//   try {
//     const { driverId, lat, lng, heading, speed } = req.body;

//     if (!driverId || !lat || !lng) {
//       return res.status(400).json({ success: false, error: "Missing fields" });
//     }

//     await prisma.driverLocation.upsert({
//       where: { driverId: parseInt(driverId) },
//       update: { lat, lng, heading, speed, updatedAt: new Date() },
//       create: { driverId: parseInt(driverId), lat, lng, heading, speed },
//     });

//     return res.json({ success: true });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // PATCH /api/rides/driver/online
// // Body: driverId, isOnline
// // ─────────────────────────────────────────
// router.patch("/driver/online", async (req, res) => {
//   try {
//     const { driverId, isOnline } = req.body;

//     await prisma.driver.update({
//       where: { id: parseInt(driverId) },
//       data: { isOnline, lastSeenAt: new Date() },
//     });

//     return res.json({ success: true });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// // ─────────────────────────────────────────
// // PATCH /api/rides/driver/push-token
// // Body: userId, pushToken
// // ─────────────────────────────────────────
// router.patch("/driver/push-token", async (req, res) => {
//   try {
//     const { userId, pushToken } = req.body;

//     await prisma.user.update({
//       where: { id: parseInt(userId) },
//       data: { pushToken },
//     });

//     return res.json({ success: true });
//   } catch (err) {
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { getDistance } = require("geolib");
const { calculateFareEstimates } = require("../helpers/fare.helpers");
const { emitToUser } = require("../../server");
const { prisma } = require("../config/database");

// ─────────────────────────────────────────
// GET /api/rides/fare-estimate
// ─────────────────────────────────────────
router.get("/fare-estimate", async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    if (!fromLat || !fromLng || !toLat || !toLng) {
      return res
        .status(400)
        .json({ success: false, error: "Missing coordinates" });
    }

    const { estimates } = calculateFareEstimates({
      fromLat,
      fromLng,
      toLat,
      toLng,
    });
    return res.json({ success: true, data: { estimates } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/rides/nearby-drivers
// ─────────────────────────────────────────
router.get("/nearby-drivers", async (req, res) => {
  try {
    const { lat, lng, vehicleType, radiusKm = 20 } = req.query;

    console.log(
      "🔍 Nearby search — lat:",
      lat,
      "lng:",
      lng,
      "type:",
      vehicleType,
    );

    if (!lat || !lng || !vehicleType) {
      return res.status(400).json({ success: false, error: "Missing params" });
    }

    const drivers = await prisma.driver.findMany({
      where: {
        isOnline: true,
        // isVerified: true,  ← removed for testing
        vehicleType: vehicleType.toUpperCase(),
        location: { isNot: null },
      },
      include: {
        user: { select: { id: true, name: true, phone: true } }, // ← no pushToken
        location: true,
      },
    });

    console.log("✅ Online drivers with location:", drivers.length);
    drivers.forEach((d) => {
      console.log(
        `   Driver ${d.id} — ${d.vehicleType} — lat:${d.location?.lat} lng:${d.location?.lng}`,
      );
    });

    const nearby = drivers
      .map((driver) => {
        const distMeters = getDistance(
          { latitude: parseFloat(lat), longitude: parseFloat(lng) },
          { latitude: driver.location.lat, longitude: driver.location.lng },
        );
        const distanceKm = parseFloat((distMeters / 1000).toFixed(1));
        console.log(`   Driver ${driver.id} is ${distanceKm} km away`);
        return { ...driver, distanceKm };
      })
      .filter((d) => d.distanceKm <= parseFloat(radiusKm))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    console.log("✅ Nearby after radius filter:", nearby.length);

    return res.json({ success: true, data: { drivers: nearby } });
  } catch (err) {
    console.log("❌ nearby-drivers error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/rides/book
// ─────────────────────────────────────────
router.post("/book", async (req, res) => {
  try {
    const {
      customerId,
      driverId,
      vehicleType,
      pickupLat,
      pickupLng,
      pickupAddress,
      dropLat,
      dropLng,
      dropAddress,
      fare,
      distanceKm,
      durationMin,
    } = req.body;

    console.log("📦 Book ride request:", req.body);

    if (
      !customerId ||
      !driverId ||
      !vehicleType ||
      !pickupLat ||
      !pickupLng ||
      !pickupAddress ||
      !dropLat ||
      !dropLng ||
      !dropAddress ||
      !fare
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Check driver is online
    const driver = await prisma.driver.findFirst({
      where: {
        id: parseInt(driverId),
        isOnline: true,
        // isVerified: true,  ← removed for testing
      },
      include: {
        user: { select: { id: true, name: true, phone: true } }, // ← no pushToken
      },
    });

    if (!driver) {
      return res.status(400).json({
        success: false,
        error: "Driver is no longer available. Please select another.",
      });
    }

    // Check driver has no active ride
    const activeRide = await prisma.ride.findFirst({
      where: {
        driverId: driver.id,
        status: { in: ["PENDING", "ACCEPTED", "DRIVER_ARRIVED", "ONGOING"] },
      },
    });

    if (activeRide) {
      return res.status(400).json({
        success: false,
        error: "Driver already has an active ride.",
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Create ride
    const ride = await prisma.ride.create({
      data: {
        customerId: parseInt(customerId),
        driverId: driver.id,
        vehicleType: vehicleType.toUpperCase(),
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        pickupAddress,
        dropLat: parseFloat(dropLat),
        dropLng: parseFloat(dropLng),
        dropAddress,
        fare: parseFloat(fare),
        distanceKm: parseFloat(distanceKm || 0),
        durationMin: parseInt(durationMin || 0),
        otp,
        status: "PENDING",
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    console.log("✅ Ride created:", ride.id, "OTP:", otp);
    console.log("📡 Emitting to driver userId:", driver.userId);

    // ✅ Socket.io only — no push notification
    const emitted = emitToUser(driver.userId, "new_ride_request", ride);
    console.log(
      "📡 Socket emit result:",
      emitted ? "✅ delivered" : "❌ driver not connected",
    );

    return res.json({ success: true, data: { ride } });
  } catch (err) {
    console.log("❌ Book error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/rides/:id/accept
// ─────────────────────────────────────────
router.patch("/:id/accept", async (req, res) => {
  try {
    const rideId = parseInt(req.params.id);

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride)
      return res.status(404).json({ success: false, error: "Ride not found" });
    if (ride.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, error: "Ride is no longer pending" });
    }

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
      include: {
        customer: { select: { id: true } },
        driver: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    console.log(
      "✅ Ride accepted:",
      rideId,
      "Notifying customer:",
      updated.customerId,
    );

    // ✅ Socket only
    const emitted = emitToUser(
      updated.customerId,
      "ride_status_update",
      updated,
    );
    console.log("📡 Customer notified:", emitted ? "✅" : "❌ not connected");

    return res.json({ success: true, data: { ride: updated } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/rides/:id/arrived
// ─────────────────────────────────────────
router.patch("/:id/arrived", async (req, res) => {
  try {
    const rideId = parseInt(req.params.id);

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { status: "DRIVER_ARRIVED", arrivedAt: new Date() },
      include: { customer: { select: { id: true } } },
    });

    emitToUser(updated.customerId, "ride_status_update", updated);
    console.log("✅ Driver arrived — customer notified");

    return res.json({ success: true, data: { ride: updated } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/rides/:id/start
// ─────────────────────────────────────────
router.patch("/:id/start", async (req, res) => {
  try {
    const rideId = parseInt(req.params.id);
    const { enteredOtp } = req.body;

    if (!enteredOtp) {
      return res.status(400).json({ success: false, error: "OTP is required" });
    }

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride)
      return res.status(404).json({ success: false, error: "Ride not found" });

    if (ride.otp !== String(enteredOtp)) {
      return res
        .status(400)
        .json({ success: false, error: "Wrong OTP. Please try again." });
    }

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { status: "ONGOING", startedAt: new Date() },
      include: { customer: { select: { id: true } } },
    });

    emitToUser(updated.customerId, "ride_status_update", updated);
    console.log("✅ Ride started");

    return res.json({ success: true, data: { ride: updated } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/rides/:id/complete
// ─────────────────────────────────────────
router.patch("/:id/complete", async (req, res) => {
  try {
    const rideId = parseInt(req.params.id);

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true },
    });
    if (!ride)
      return res.status(404).json({ success: false, error: "Ride not found" });

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { status: "COMPLETED", completedAt: new Date() },
      include: { customer: { select: { id: true } } },
    });

    const driverEarning = parseFloat((ride.fare * 0.85).toFixed(2));

    await prisma.driverEarning.create({
      data: {
        driverId: ride.driverId,
        amount: driverEarning,
        type: "RIDE",
        status: "PENDING",
        description: `Ride #${ride.id} · ${ride.pickupAddress} → ${ride.dropAddress}`,
        rideId: ride.id,
      },
    });

    await prisma.driver.update({
      where: { id: ride.driverId },
      data: {
        totalRides: { increment: 1 },
        walletBalance: { increment: driverEarning },
        lastSeenAt: new Date(),
      },
    });

    emitToUser(updated.customerId, "ride_status_update", updated);
    console.log("✅ Ride completed — driver earned ₹" + driverEarning);

    return res.json({ success: true, data: { ride: updated, driverEarning } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/rides/:id/cancel
// ─────────────────────────────────────────
router.patch("/:id/cancel", async (req, res) => {
  try {
    const rideId = parseInt(req.params.id);
    const { reason = "No reason", cancelledBy = "customer" } = req.body;

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason,
        cancelledBy,
      },
      include: {
        customer: { select: { id: true } },
        driver: {
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (cancelledBy === "customer") {
      emitToUser(updated.driver.userId, "ride_status_update", updated);
      console.log("✅ Cancelled by customer — driver notified");
    } else {
      emitToUser(updated.customerId, "ride_status_update", updated);
      console.log("✅ Cancelled by driver — customer notified");
    }

    return res.json({ success: true, data: { ride: updated } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/rides/driver/location
// ─────────────────────────────────────────
router.patch("/driver/location", async (req, res) => {
  try {
    const { driverId, lat, lng, heading, speed } = req.body;

    if (!driverId || !lat || !lng) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    await prisma.driverLocation.upsert({
      where: { driverId: parseInt(driverId) },
      update: { lat, lng, heading, speed, updatedAt: new Date() },
      create: { driverId: parseInt(driverId), lat, lng, heading, speed },
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/driver/toggle-online (add location seed)
// Put this in your driver.route.js instead
// ─────────────────────────────────────────
router.patch("/driver/online", async (req, res) => {
  try {
    const { driverId, isOnline } = req.body;

    await prisma.driver.update({
      where: { id: parseInt(driverId) },
      data: { isOnline, lastSeenAt: new Date() },
    });

    // ✅ Seed Morigaon location when going online
    if (isOnline) {
      await prisma.driverLocation.upsert({
        where: { driverId: parseInt(driverId) },
        update: { updatedAt: new Date() },
        create: { driverId: parseInt(driverId), lat: 26.2461, lng: 92.3382 },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
