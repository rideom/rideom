const jwt = require("jsonwebtoken");
const prisma    = require("../config/database");

const authMiddleware = async(req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log("authhaeder",authHeader)

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    // console.log("user",user)
    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = {authMiddleware};
