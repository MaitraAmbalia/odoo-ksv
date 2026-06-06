import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = await bcrypt.hash('Password123!', 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendorbridge.com' },
    update: {},
    create: { firstName: 'Admin', lastName: 'User', email: 'admin@vendorbridge.com', passwordHash: hash, role: 'ADMIN' },
  });

  // Procurement Officer
  const officer = await prisma.user.upsert({
    where: { email: 'officer@vendorbridge.com' },
    update: {},
    create: { firstName: 'Procurement', lastName: 'Officer', email: 'officer@vendorbridge.com', passwordHash: hash, role: 'PROCUREMENT_OFFICER' },
  });

  // Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@vendorbridge.com' },
    update: {},
    create: { firstName: 'Manager', lastName: 'User', email: 'manager@vendorbridge.com', passwordHash: hash, role: 'MANAGER' },
  });

  // Vendor users + profiles
  const vendorData = [
    { first: 'Rajesh', last: 'Patel', email: 'rajesh@steelworks.com', company: 'Patel Steelworks Pvt Ltd', category: 'Steel & Metals', gst: '24AADCP1234A1ZP', phone: '9876543210' },
    { first: 'Priya', last: 'Sharma', email: 'priya@electrosupply.com', company: 'Sharma Electro Supply', category: 'Electrical', gst: '27AADCS5678B1ZQ', phone: '9876543211' },
    { first: 'Amit', last: 'Kumar', email: 'amit@buildmart.com', company: 'BuildMart Solutions', category: 'Construction', gst: '06AADCK9012C1ZR', phone: '9876543212' },
  ];

  for (const v of vendorData) {
    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: {},
      create: { firstName: v.first, lastName: v.last, email: v.email, passwordHash: hash, role: 'VENDOR' },
    });
    await prisma.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, companyName: v.company, category: v.category, gstNumber: v.gst, contactPhone: v.phone, status: 'ACTIVE' },
    });
  }

  console.log('✅ Seed complete');
  console.log('   Login credentials for all users: Password123!');
  console.log('   Admin:   admin@vendorbridge.com');
  console.log('   Officer: officer@vendorbridge.com');
  console.log('   Manager: manager@vendorbridge.com');
  console.log('   Vendors: rajesh@steelworks.com, priya@electrosupply.com, amit@buildmart.com');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
