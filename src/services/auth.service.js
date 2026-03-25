const prisma = require("../config/database");
const { genarateToken, generateToken } = require("../utils/jwt.utils");

//signup or login for user 
const LoginOrSignup = async (phone) => {
  let user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { phone },
    });
  }

  // console.log("User ",user)
  const token = generateToken({
    id: user.id,
    role: user.role,
  });

  return{user,token}

};

module.exports = { LoginOrSignup };
