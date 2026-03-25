const express = require('express');
const router = express.Router();

const {authMiddleware} = require('../middleware/auth.middleware');
const {roleMiddleware} = require('../middleware/role.middleware');

//testing purpose 
router.get(
  "/user",
  authMiddleware,
  roleMiddleware("USER"),
  (req, res) => {
    res.json({
      message: "Welcome USER",
      user: req.user
    });
  }
);

module.exports = router