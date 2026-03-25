const driverService = require("../services/driver.service");


//Register Driver 
const registerDriver = async (req, res) => {
  // console.log("req",req.body)
  try {
    const data = await driverService.registerDriver(req.user.id, req.body);
    // console.log("data",req.body)
    res.status(201).json({ success: true, message: "Driver profile created. Upload your documents.", data });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};


// Upload Document, Get Profile, Toggle Online, Update Location, Get Earnings.............................
const uploadDocument = async (req, res) => {
  try {
    const data = await driverService.uploadDocument(req.user.id, req.body.type, req.file);
    res.status(200).json({ success: true, message: "Document uploaded", data });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};


// Get Driver Profile
const getDriverProfile = async (req, res) => {
  try {
    const data = await driverService.getDriverProfile(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};


// Toggle Online/Offline
const toggleOnline = async (req, res) => {
  try {
    const data = await driverService.toggleOnline(req.user.id);
    res.status(200).json({ success: true, message: data.message, data });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};


// Update Location
const updateLocation = async (req, res) => {
  try {
    const data = await driverService.updateLocation(req.user.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};


// Get Earnings
const getEarnings = async (req, res) => {
  try {
    const data = await driverService.getEarnings(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (e) {
    res.status(e.status || 500).json({ success: false, message: e.message });
  }
};

module.exports = {
  registerDriver,
  uploadDocument,
  getDriverProfile,
  toggleOnline,
  updateLocation,
  getEarnings,
};