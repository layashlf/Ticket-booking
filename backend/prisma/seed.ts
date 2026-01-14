import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed ticket tiers
  const vipTier = await prisma.ticketTier.upsert({
    where: { name: "VIP" },
    update: {},
    create: {
      name: "VIP",
      price: 100,
    },
  });

  const frontRowTier = await prisma.ticketTier.upsert({
    where: { name: "FRONT_ROW" },
    update: {},
    create: {
      name: "FRONT_ROW",
      price: 50,
    },
  });

  const gaTier = await prisma.ticketTier.upsert({
    where: { name: "GA" },
    update: {},
    create: {
      name: "GA",
      price: 10,
    },
  });

  // Seed ticket inventory
  await prisma.ticketInventory.upsert({
    where: { tierId: vipTier.id },
    update: {},
    create: {
      tierId: vipTier.id,
      quantityAvailable: 100,
    },
  });

  await prisma.ticketInventory.upsert({
    where: { tierId: frontRowTier.id },
    update: {},
    create: {
      tierId: frontRowTier.id,
      quantityAvailable: 200,
    },
  });

  await prisma.ticketInventory.upsert({
    where: { tierId: gaTier.id },
    update: {},
    create: {
      tierId: gaTier.id,
      quantityAvailable: 500,
    },
  });

  console.log("Seeding completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
