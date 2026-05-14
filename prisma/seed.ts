import "dotenv/config";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL must be configured.");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@ieab.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? randomBytes(18).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  console.log("Preparing clean production seed...");

  await prisma.$transaction([
    prisma.cell.updateMany({ data: { leaderId: null } }),
    prisma.person.updateMany({ data: { cellId: null } }),
    prisma.person.deleteMany(),
    prisma.cell.deleteMany(),
    prisma.event.deleteMany(),
    prisma.monthlyReport.deleteMany(),
    prisma.user.deleteMany(),
    prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Administrador",
        role: "ADMIN",
      },
    }),
  ]);

  const [users, people, cells, events, reports] = await Promise.all([
    prisma.user.count(),
    prisma.person.count(),
    prisma.cell.count(),
    prisma.event.count(),
    prisma.monthlyReport.count(),
  ]);

  console.log("Clean seed complete.");
  console.log(`Users: ${users}`);
  console.log(`People: ${people}`);
  console.log(`Cells: ${cells}`);
  console.log(`Events: ${events}`);
  console.log(`Reports: ${reports}`);
  console.log(`Admin email: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Admin password: ${password}`);
  } else {
    console.log("Admin password: configured from ADMIN_PASSWORD");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
