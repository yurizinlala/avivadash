import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.person.deleteMany();
  await prisma.cell.deleteMany();
  await prisma.event.deleteMany();
  await prisma.monthlyReport.deleteMany();

  // --- CELLS ---
  const celula1 = await prisma.cell.create({
    data: {
      name: "Célula Videira",
      leaderName: "Ricardo & Ana Silva",
      leaderPhone: "(11) 99876-5432",
      address: "Rua das Flores, 123 — Santana",
      dayOfWeek: "Quartas-feiras",
      time: "20:00",
      isActive: true,
    },
  });

  const celula2 = await prisma.cell.create({
    data: {
      name: "Célula Oliveira",
      leaderName: "Pr. Marcos Oliveira",
      leaderPhone: "(11) 98765-1234",
      address: "Av. Central, 1001 — Ap. 04",
      dayOfWeek: "Terças-feiras",
      time: "19:30",
      isActive: true,
    },
  });

  const celula3 = await prisma.cell.create({
    data: {
      name: "Célula Cedro",
      leaderName: "Helena Santos",
      leaderPhone: "(11) 97654-3210",
      address: "Rua do Bosque, 45 — Vila Nova",
      dayOfWeek: "Sábados",
      time: "16:00",
      isActive: true,
    },
  });

  const celula4 = await prisma.cell.create({
    data: {
      name: "Célula Figueira",
      leaderName: "Douglas Lima",
      leaderPhone: "(11) 95432-1098",
      address: "Travessa da Paz, 88 — Penha",
      dayOfWeek: "Quintas-feiras",
      time: "20:15",
      isActive: true,
    },
  });

  // --- PEOPLE ---
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  await prisma.person.createMany({
    data: [
      {
        fullName: "Ana Paula Silva",
        email: "ana.silva@email.com",
        phone: "(11) 99876-5432",
        birthDate: new Date(1979, todayMonth, todayDay),
        maritalStatus: "CASADO",
        profession: "Professora",
        personType: "MEMBRO",
        memberStatus: "ATIVO",
        isBaptized: true,
        baptismDate: new Date(2005, 2, 15),
        conversionDate: new Date(2004, 8, 20),
        cep: "02045-010",
        street: "Rua das Flores",
        number: "123",
        neighborhood: "Santana",
        city: "São Paulo",
        state: "SP",
        cellId: celula1.id,
        notes: "Líder de célula e professora da EBD",
      },
      {
        fullName: "Lucas Ferreira",
        email: "lucas.ferreira@email.com",
        phone: "(11) 98765-1234",
        birthDate: new Date(1992, 7, 22),
        maritalStatus: "SOLTEIRO",
        profession: "Engenheiro de Software",
        personType: "MEMBRO",
        memberStatus: "ATIVO",
        isBaptized: true,
        baptismDate: new Date(2015, 5, 10),
        conversionDate: new Date(2014, 11, 25),
        cellId: celula2.id,
      },
      {
        fullName: "Ricardo Santos",
        phone: "(11) 91234-5678",
        birthDate: new Date(1985, 10, 30),
        personType: "VISITANTE",
        memberStatus: "ATIVO",
        isBaptized: false,
        notes: "Veio pela primeira vez dia 15/03. Interesse em estudos bíblicos.",
      },
      {
        fullName: "Maria Oliveira",
        email: "maria.oliv@email.com",
        phone: "(11) 97654-3210",
        birthDate: new Date(1968, 2, 9),
        maritalStatus: "CASADO",
        profession: "Enfermeira",
        personType: "MEMBRO",
        memberStatus: "ATIVO",
        isBaptized: true,
        baptismDate: new Date(1995, 6, 20),
        conversionDate: new Date(1994, 3, 12),
        cellId: celula3.id,
      },
      {
        fullName: "Pedro Costa",
        phone: "(11) 95432-1098",
        birthDate: new Date(2001, 0, 17),
        personType: "CONGREGADO",
        memberStatus: "ATIVO",
        isBaptized: false,
        cellId: celula1.id,
      },
      {
        fullName: "Juliana Mendes",
        email: "juliana.mendes@email.com",
        phone: "(11) 93210-8765",
        birthDate: new Date(1990, 6, 25),
        maritalStatus: "SOLTEIRO",
        profession: "Designer Gráfica",
        personType: "MEMBRO",
        memberStatus: "INATIVO",
        isBaptized: true,
        baptismDate: new Date(2012, 9, 5),
        cellId: celula4.id,
        notes: "Mudou de cidade temporariamente. Retorno previsto em 6 meses.",
      },
      {
        fullName: "Carlos Almeida",
        email: "carlos.almeida@email.com",
        phone: "(11) 92109-6543",
        birthDate: new Date(1975, 11, 5),
        maritalStatus: "CASADO",
        weddingDate: new Date(2002, 4, 18),
        profession: "Contador",
        personType: "MEMBRO",
        memberStatus: "ATIVO",
        isBaptized: true,
        baptismDate: new Date(1998, 1, 14),
        conversionDate: new Date(1997, 7, 3),
        cellId: celula2.id,
      },
      {
        fullName: "Fernanda Lima",
        phone: "(11) 90987-4321",
        birthDate: new Date(1998, 5, 18),
        personType: "VISITANTE",
        memberStatus: "ATIVO",
        isBaptized: false,
        notes: "Amiga da Juliana. Começou a frequentar em fevereiro.",
      },
      {
        fullName: "Marcos Souza",
        email: "marcos.souza@email.com",
        phone: "(11) 94567-8901",
        birthDate: new Date(1997, todayMonth, todayDay),
        maritalStatus: "SOLTEIRO",
        profession: "Músico",
        personType: "MEMBRO",
        memberStatus: "ATIVO",
        isBaptized: true,
        baptismDate: new Date(2018, 3, 22),
        cellId: celula1.id,
        notes: "Ministério de Louvor — Tecladista",
      },
      {
        fullName: "Lucia Costa",
        email: "lucia.costa@email.com",
        phone: "(11) 93456-7890",
        birthDate: new Date(1964, todayMonth, todayDay),
        maritalStatus: "VIUVO",
        profession: "Aposentada",
        personType: "MEMBRO",
        memberStatus: "ATIVO",
        isBaptized: true,
        baptismDate: new Date(1988, 8, 10),
        conversionDate: new Date(1987, 2, 5),
        cellId: celula3.id,
        notes: "Ministério de Intercessão — Líder",
      },
    ],
  });

  // --- EVENTS ---
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  await prisma.event.createMany({
    data: [
      {
        title: "Culto de Celebração",
        description: "Culto dominical com ministração da Palavra e louvor.",
        date: new Date(thisYear, thisMonth, getNextSunday()),
        time: "18:00",
        location: "Templo Central",
        type: "culto",
        isRecurrent: true,
      },
      {
        title: "Reunião de Liderança",
        description: "Reunião mensal com todos os líderes de célula e obreiros.",
        date: new Date(thisYear, thisMonth, Math.min(getNextWeekday(1), 28)),
        time: "19:30",
        location: "Templo Central",
        type: "reuniao",
        isRecurrent: true,
      },
      {
        title: "Culto de Quarta",
        description: "Estudo bíblico e oração.",
        date: new Date(thisYear, thisMonth, Math.min(getNextWeekday(3), 28)),
        time: "19:30",
        location: "Templo Central",
        type: "culto",
        isRecurrent: true,
      },
      {
        title: "Congresso de Mulheres",
        description: "Congresso anual de mulheres com preletoras convidadas.",
        date: new Date(thisYear, thisMonth, Math.min(15, 28)),
        time: "15:00",
        location: "Templo Sede",
        type: "congresso",
        isRecurrent: false,
      },
      {
        title: "Batismo nas Águas",
        description: "Cerimônia de batismo para novos convertidos.",
        date: new Date(thisYear, thisMonth, Math.min(20, 28)),
        time: "09:00",
        location: "Chácara Ebenezer",
        type: "congresso",
        isRecurrent: false,
      },
      {
        title: "Escola Bíblica Dominical",
        description: "Estudo sistemático da Bíblia para todas as idades.",
        date: new Date(thisYear, thisMonth, getNextSunday()),
        time: "09:00",
        location: "Templo Central",
        type: "culto",
        isRecurrent: true,
      },
    ],
  });

  // --- MONTHLY REPORTS ---
  await prisma.monthlyReport.createMany({
    data: [
      {
        referenceMonth: new Date(thisYear, thisMonth - 2, 1),
        totalMembers: 1260,
        totalVisitors: 45,
        totalBaptisms: 3,
        totalConversions: 8,
        totalTransfers: 1,
        totalTithes: 35400.0,
        totalOfferings: 8200.0,
        totalOtherIncome: 1500.0,
        totalExpenses: 28900.0,
        generatedAt: new Date(thisYear, thisMonth - 1, 5),
      },
      {
        referenceMonth: new Date(thisYear, thisMonth - 1, 1),
        totalMembers: 1272,
        totalVisitors: 52,
        totalBaptisms: 5,
        totalConversions: 12,
        totalTransfers: 0,
        totalTithes: 38200.0,
        totalOfferings: 9650.0,
        totalOtherIncome: 2000.0,
        totalExpenses: 31500.0,
        generatedAt: new Date(thisYear, thisMonth, 3),
      },
    ],
  });

  const totalPeople = await prisma.person.count();
  const totalCells = await prisma.cell.count();
  const totalEvents = await prisma.event.count();
  const totalReports = await prisma.monthlyReport.count();
  console.log(
    `✅ Seed complete: ${totalPeople} people, ${totalCells} cells, ${totalEvents} events, ${totalReports} reports`
  );
}

function getNextSunday(): number {
  const today = new Date();
  const day = today.getDate();
  const dow = today.getDay();
  return Math.min(day + (7 - dow), 28);
}

function getNextWeekday(target: number): number {
  const today = new Date();
  const day = today.getDate();
  const dow = today.getDay();
  const diff = (target - dow + 7) % 7;
  return day + (diff === 0 ? 7 : diff);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
