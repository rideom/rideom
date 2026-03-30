const { PrismaClient } = require("@prisma/client");

// Prevent multiple instances in development
const globalForPrisma = global;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;