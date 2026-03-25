const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const { authMiddleware } = require("../middleware/auth.middleware");
const { roleMiddleware } = require("../middleware/role.middleware");
const {
  registerDriver,
  uploadDocument,
  getDriverProfile,
  toggleOnline,
  updateLocation,
  getEarnings,
} = require("../controller/driver.controller");

// ── Protected — only DRIVER role ──────────────────────────────────────────

router.post(
  "/register",
  authMiddleware,
  roleMiddleware("USER", "DRIVER"), // USER registers, DRIVER re-submits
  registerDriver,
);

router.post(
  "/documents/upload",
  authMiddleware,
  roleMiddleware("DRIVER"),
  upload.single("file"),
  uploadDocument,
);

router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("DRIVER"),
  getDriverProfile,
);

router.patch(
  "/toggle-online",
  authMiddleware,
  roleMiddleware("DRIVER"),
  toggleOnline,
);

router.patch(
  "/location",
  authMiddleware,
  roleMiddleware("DRIVER"),
  updateLocation,
);

router.get("/earnings", authMiddleware, roleMiddleware("DRIVER"), getEarnings);

module.exports = router;
