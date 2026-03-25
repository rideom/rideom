const otpService = require("../services/otp.service");
const authService = require("../services/auth.service");

//send otp controller
const sendOtp = async (req, res) => {
  const { phone } = req.body;
  try {
    await otpService.sendOtp(phone);
    res.status(200).json({success: true, message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

};

//verify otp controller
const verifyOtp = async (req, res) => {
    const {phone,code} = req.body;
    try {
        await otpService.verifyOtp(phone,code)

        const data = await authService.LoginOrSignup(phone)
        res.status(200).json({message:"OTP verified successfully",data})
        
    } catch (error) {
        res.status(500).json({ error: error.message });
        
    }
}

module.exports = { sendOtp, verifyOtp };
