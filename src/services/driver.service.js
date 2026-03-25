const prisma    = require("../config/database");
const cloudinary = require("../config/cloudinary");
const AppError  = require("../utils/error");



// ── Register Driver ───────────────────────────────────────────────────────

const registerDriver = async (userId, body) => {
  const {
    vehicleType, vehicleNumber, vehicleModel,
    city, bankAccount, ifscCode, accountName,
  } = body;

  console.log("data",body)
  // Validation
  if (!vehicleType || !vehicleNumber || !vehicleModel) {
    throw new AppError("vehicleType, vehicleNumber and vehicleModel are required", 400);
  }

  const validTypes = ["BIKE", "AUTO", "CAR", "ERICKSHAW"];
  if (!validTypes.includes(vehicleType.toUpperCase())) {
    throw new AppError(`vehicleType must be one of: ${validTypes.join(", ")}`, 400);
  }

  // Check already exists
  const existing = await prisma.driver.findUnique({ where: { userId } });
  if (existing) {
    throw new AppError("Driver profile already exists", 409);
  }

  // Create driver
  const driver = await prisma.driver.create({
    data: {
      userId,
      vehicleType:   vehicleType.toUpperCase(),
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      vehicleModel:  vehicleModel.trim(),
      city:          city || "Morigaon",
      bankAccount:   bankAccount   || null,
      ifscCode:      ifscCode      ? ifscCode.toUpperCase() : null,
      accountName:   accountName   || null,
    },
    include: {
      user: { select: { id: true, name: true, phone: true, role: true } },
    },
  });

  // Update user role
  await prisma.user.update({
    where: { id: userId },
    data:  { role: "DRIVER" },
  });

  return driver;
};




// ── Upload Document ───────────────────────────────────────────────────────

const uploadDocument = async (userId, type, file) => {
  console.log("type",type)
  const validTypes = [
    "AADHAAR", "DRIVING_LICENCE",
    "VEHICLE_RC", "VEHICLE_PHOTO", "PROFILE_PHOTO",
  ];

  if (!type || !validTypes.includes(type.toUpperCase())) {
    throw new AppError(`type must be one of: ${validTypes.join(", ")}`, 400);
  }

  if (!file) {
    throw new AppError("No file uploaded", 400);
  }

  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) {
    throw new AppError("Register as driver first", 404);
  }

  // Upload to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        `rideom/drivers/${driver.id}/${type.toLowerCase()}`,
        resource_type: "image",
        quality:       "auto",
      },
      (error, result) => {
        if (error) reject(new AppError("File upload failed", 500));
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  // Check existing document of same type
  const existing = await prisma.driverDocument.findFirst({
    where: { driverId: driver.id, type: type.toUpperCase() },
  });

  if (existing) {
    // Delete old from Cloudinary
    if (existing.publicId) {
      await cloudinary.uploader.destroy(existing.publicId);
    }
    return prisma.driverDocument.update({
      where: { id: existing.id },
      data:  {
        fileUrl:    uploadResult.secure_url,
        publicId:   uploadResult.public_id,
        isVerified: false,
      },
    });
  }

  return prisma.driverDocument.create({
    data: {
      driverId: driver.id,
      type:     type.toUpperCase(),
      fileUrl:  uploadResult.secure_url,
      publicId: uploadResult.public_id,
    },
  });
};




// ── Get Driver Profile ────────────────────────────────────────────────────
const getDriverProfile = async (userId) => {
  const driver = await prisma.driver.findUnique({
    where: { userId },
    include: {
      user:      { select: { id: true, name: true, phone: true } },
      documents: true,
      location:  true,
      earnings:  { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }

  const requiredDocs = ["AADHAAR", "DRIVING_LICENCE", "VEHICLE_RC", "VEHICLE_PHOTO"];
  const uploadedDocs = driver.documents.map((d) => d.type);
  const missingDocs  = requiredDocs.filter((d) => !uploadedDocs.includes(d));

  return {
    ...driver,
    missingDocuments:  missingDocs,
    isProfileComplete: missingDocs.length === 0,
  };
};




// ── Toggle Online ─────────────────────────────────────────────────────────
const toggleOnline = async (userId) => {
  const driver = await prisma.driver.findUnique({ where: { userId } });

  if (!driver) {
    throw new AppError("Driver profile not found", 404);
  }

  // if (!driver.isVerified && !driver.isOnline) {
  //   throw new AppError("Account pending verification. Wait for admin approval.", 403);
  // }

  const newStatus = !driver.isOnline;

  const updated = await prisma.driver.update({
    where: { userId },
    data:  { isOnline: newStatus, lastSeenAt: new Date() },
  });

  return {
    isOnline:   updated.isOnline,
    lastSeenAt: updated.lastSeenAt,
    message:    newStatus ? "You are now ONLINE" : "You are now OFFLINE",
  };
};




// ── Update Location ───────────────────────────────────────────────────────
const updateLocation = async (userId, body) => {
  const { lat, lng, heading, speed } = body;

  if (!lat || !lng) {
    throw new AppError("lat and lng are required", 400);
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new AppError("Invalid coordinates", 400);
  }

  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) {
    throw new AppError("Driver not found", 404);
  }

  const location = await prisma.driverLocation.upsert({
    where:  { driverId: driver.id },
    update: {
      lat:     parseFloat(lat),
      lng:     parseFloat(lng),
      heading: heading ? parseFloat(heading) : null,
      speed:   speed   ? parseFloat(speed)   : null,
    },
    create: {
      driverId: driver.id,
      lat:      parseFloat(lat),
      lng:      parseFloat(lng),
      heading:  heading ? parseFloat(heading) : null,
      speed:    speed   ? parseFloat(speed)   : null,
    },
  });

  await prisma.driver.update({
    where: { id: driver.id },
    data:  { lastSeenAt: new Date() },
  });

  return location;
};




// ── Get Earnings ──────────────────────────────────────────────────────────
const getEarnings = async (userId) => {
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) {
    throw new AppError("Driver not found", 404);
  }

  const now        = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, week, month, allTime, recent] = await Promise.all([
    prisma.driverEarning.aggregate({
      where: { driverId: driver.id, createdAt: { gte: todayStart } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.driverEarning.aggregate({
      where: { driverId: driver.id, createdAt: { gte: weekStart } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.driverEarning.aggregate({
      where: { driverId: driver.id, createdAt: { gte: monthStart } },
      _sum: { amount: true }, _count: true,
    }),
    prisma.driverEarning.aggregate({
      where: { driverId: driver.id },
      _sum: { amount: true }, _count: true,
    }),
    prisma.driverEarning.findMany({
      where:   { driverId: driver.id },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
  ]);

  return {
    walletBalance: driver.walletBalance,
    summary: {
      today:     { amount: today._sum.amount    || 0, trips: today._count    },
      thisWeek:  { amount: week._sum.amount     || 0, trips: week._count     },
      thisMonth: { amount: month._sum.amount    || 0, trips: month._count    },
      allTime:   { amount: allTime._sum.amount  || 0, trips: allTime._count  },
    },
    recentTransactions: recent,
  };
};

module.exports = {
  registerDriver,
  uploadDocument,
  getDriverProfile,
  toggleOnline,
  updateLocation,
  getEarnings,
};