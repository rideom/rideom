const prisma = require("../config/database");
const { generateOTP } = require("../utils/otp.utils");

//send otp
const sendOtp = async (phone) => {
  // Generate a random OTP
  const code = generateOTP();

  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); //2 minutes from now
  await prisma.oTP.create({
    data: {
      phone,
      code,
      expiresAt,
    },
  });

  console.log(`The OTP to verify ${phone} is : ${code}`);
  return true;
};

//verify otp
const verifyOtp = async (phone, code) => {
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      phone,
      code,
      verified: false,
    },
    orderBy: {
      id: "desc",
    },
  });

  if (!otpRecord) {
    throw new Error("Invalid OTP");
  }
  if (otpRecord.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  //verified user
  await prisma.oTP.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });
  return true;
};

module.exports = { sendOtp, verifyOtp };
