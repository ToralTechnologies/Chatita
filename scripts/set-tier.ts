/**
 * Set a user's subscription tier.
 * Usage: npx tsx scripts/set-tier.ts <email> <tier>
 * Tiers: free | pro | unlimited
 * Example: npx tsx scripts/set-tier.ts torall@umich.edu unlimited
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [email, tier] = process.argv.slice(2);

  if (!email || !tier) {
    console.error('Usage: npx tsx scripts/set-tier.ts <email> <tier>');
    console.error('Tiers: free | pro | unlimited');
    process.exit(1);
  }

  const validTiers = ['free', 'pro', 'unlimited'];
  if (!validTiers.includes(tier)) {
    console.error(`Invalid tier "${tier}". Must be one of: ${validTiers.join(', ')}`);
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { tier },
    select: { id: true, email: true, tier: true },
  });

  console.log(`✅ Updated user ${user.email} to tier: ${user.tier}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
