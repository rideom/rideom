const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./src/routes/auth.route");
const proctedRoute = require("./src/routes/protected.route");
const driverRoutes = require("./src/routes/driver.route");

const app = express();

app.use(cors());
app.use(express.json());

//test route
app.get("/", (req, res) => {
  res.send("Rideom API Running 🚀");
});
//auth route
app.use("/api/auth", authRoutes);
app.use("/api/protectd",proctedRoute)
app.use("/api/driver", driverRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
