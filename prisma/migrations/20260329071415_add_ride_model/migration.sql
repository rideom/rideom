/*
  Warnings:

  - A unique constraint covering the columns `[rideId]` on the table `DriverEarning` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DRIVER_ARRIVED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Ride" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "driverId" INTEGER,
    "vehicleType" "VehicleType" NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "dropLat" DOUBLE PRECISION NOT NULL,
    "dropLng" DOUBLE PRECISION NOT NULL,
    "dropAddress" TEXT NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "otp" TEXT NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'PENDING',
    "cancelReason" TEXT,
    "cancelledBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverEarning_rideId_key" ON "DriverEarning"("rideId");

-- AddForeignKey
ALTER TABLE "DriverEarning" ADD CONSTRAINT "DriverEarning_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
