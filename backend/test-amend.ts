import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching an active RFQ...');
  const rfq = await prisma.rFQ.findFirst({
    where: { status: 'PUBLISHED' },
    include: { items: true }
  });

  if (!rfq) {
    console.log('No PUBLISHED RFQ found to amend.');
    return;
  }

  console.log(`Amending RFQ: ${rfq.title}`);
  
  const officer = await prisma.user.findFirst({ where: { role: 'PROCUREMENT_OFFICER' } });
  if (!officer) {
    console.log('No officer found');
    return;
  }

  // Import the service
  const { amendRFQ } = require('./src/services/rfq.service');

  const newRfq = await amendRFQ(rfq.id, {
    amendmentNote: 'Quantity increased by 10 for all items',
    deadline: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    items: rfq.items.map(item => ({
      ...item,
      quantity: item.quantity + 10
    }))
  }, officer.id);

  console.log('Successfully amended RFQ!');
  console.log(`Old RFQ: ${rfq.id} (status should be AMENDED)`);
  console.log(`New RFQ: ${newRfq.id} (Rev ${newRfq.revision}, Parent: ${newRfq.parentRfqId})`);

  // Check the old RFQ status
  const oldRfqCheck = await prisma.rFQ.findUnique({ where: { id: rfq.id } });
  console.log(`Old RFQ is now: ${oldRfqCheck?.status}`);

  // Check superseded quotes
  const quotes = await prisma.quotation.findMany({ where: { rfqId: rfq.id } });
  console.log(`Found ${quotes.length} quotations for old RFQ.`);
  quotes.forEach(q => console.log(`  - Quote ${q.id}: ${q.status}`));

  // Check notifications generated for the new RFQ
  const notifications = await prisma.notification.findMany({ where: { entityId: newRfq.id } });
  console.log(`Generated ${notifications.length} notifications for vendors.`);
  notifications.forEach(n => console.log(`  - Notification: ${n.title} -> ${n.body}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
