import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const connectionString = process.env.DATABASE_URL

const adapter = new PrismaPg({ connectionString })
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaConnectionPromise?: Promise<void>
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (!globalForPrisma.prismaConnectionPromise) {
  globalForPrisma.prismaConnectionPromise = prisma
    .$connect()
    .then(() => {
      console.info("[db] Prisma connected")
    })
    .catch((error) => {
      console.error("[db] Prisma connection failed", error)
      throw error
    })
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export { prisma }