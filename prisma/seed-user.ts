import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

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
  const email = process.env.ADMIN_EMAIL ?? "admin@ieab.com";
  const password = process.env.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`✅ Usuário admin já existe: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  console.log(`✅ Usuário admin criado com sucesso!`);
  console.log(`   Email: ${email}`);
  console.log(`   Senha: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
