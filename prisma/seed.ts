import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing badges
  await prisma.badge.deleteMany();

  // Create badges
  const badges = [
    {
      name: 'First Steps',
      nameEs: 'Primeros Pasos',
      description: 'Track meals for 7 consecutive days',
      descriptionEs: 'Registra comidas por 7 días consecutivos',
      icon: '👣',
      daysRequired: 7,
    },
    {
      name: 'Building Habits',
      nameEs: 'Construyendo Hábitos',
      description: 'Track meals for 21 consecutive days',
      descriptionEs: 'Registra comidas por 21 días consecutivos',
      icon: '🌱',
      daysRequired: 21,
    },
    {
      name: 'Committed',
      nameEs: 'Comprometido',
      description: 'Track meals for 60 consecutive days',
      descriptionEs: 'Registra comidas por 60 días consecutivos',
      icon: '🎯',
      daysRequired: 60,
    },
    {
      name: 'Dedicated',
      nameEs: 'Dedicado',
      description: 'Track meals for 90 consecutive days',
      descriptionEs: 'Registra comidas por 90 días consecutivos',
      icon: '⭐',
      daysRequired: 90,
    },
    {
      name: 'Champion',
      nameEs: 'Campeón',
      description: 'Track meals for 180 consecutive days',
      descriptionEs: 'Registra comidas por 180 días consecutivos',
      icon: '🏆',
      daysRequired: 180,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.create({
      data: badge,
    });
  }

  console.log('Seeded badges successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
