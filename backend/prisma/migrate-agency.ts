/**
 * Run this ONCE after applying the Prisma schema migration to assign all
 * existing data (users, clients, leads, tasks, expenses, channels, etc.)
 * to a single default "Stallion Agency" so nothing is lost.
 *
 * Usage:
 *   npx ts-node prisma/migrate-agency.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating default agency for existing data...');

  // Create or reuse the default agency
  const agency = await prisma.agency.upsert({
    where: { id: 'default-stallion-agency' },
    update: {},
    create: { id: 'default-stallion-agency', name: 'Stallion Agency' },
  });

  console.log(`Agency: ${agency.id}`);

  // Assign all existing records that have no agencyId
  const [users, clients, leads, tasks, expenses, channels, meetingTypes, services] = await Promise.all([
    prisma.user.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.client.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.lead.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.task.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.expense.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.channel.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.meetingType.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.companyService.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
  ]);

  console.log('Updated records:');
  console.log(`  Users:          ${users.count}`);
  console.log(`  Clients:        ${clients.count}`);
  console.log(`  Leads:          ${leads.count}`);
  console.log(`  Tasks:          ${tasks.count}`);
  console.log(`  Expenses:       ${expenses.count}`);
  console.log(`  Channels:       ${channels.count}`);
  console.log(`  Meeting types:  ${meetingTypes.count}`);
  console.log(`  Services:       ${services.count}`);
  console.log('Done! All existing data is now assigned to the default agency.');
  console.log('Existing users must re-login to get a new JWT with their agencyId.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
