import { PrismaClient, Role, RFQStatus, QuotationStatus, ApprovalStatus, POStatus, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with realistic records...');

  // Clear existing data in reverse order of dependencies
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.gRNItem.deleteMany({});
  await prisma.gRN.deleteMany({});
  await prisma.pOItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.quotationItem.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.rFQVendorInvite.deleteMany({});
  await prisma.rFQItem.deleteMany({});
  await prisma.rFQ.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.user.deleteMany({});

  const hash = await bcrypt.hash('Password123!', 12);

  // 1. Create Core Users
  const admin = await prisma.user.create({
    data: { firstName: 'Admin', lastName: 'User', email: 'admin@vendorbridge.com', passwordHash: hash, role: 'ADMIN', country: 'India' },
  });

  const officer = await prisma.user.create({
    data: { firstName: 'Priya', lastName: 'Sharma', email: 'officer@vendorbridge.com', passwordHash: hash, role: 'PROCUREMENT_OFFICER', country: 'India' },
  });

  const manager = await prisma.user.create({
    data: { firstName: 'Rahul', lastName: 'Mehta', email: 'manager@vendorbridge.com', passwordHash: hash, role: 'MANAGER', country: 'India' },
  });

  // 2. Create Vendors
  const vendorData = [
    { first: 'Rajesh', last: 'Patel', email: 'rajesh@steelworks.com', company: 'Patel Steelworks Pvt Ltd', category: 'Construction', gst: '24AADCP1234A1ZP', phone: '9876543210', rating: 4.2 },
    { first: 'Priya', last: 'Sen', email: 'priya@electrosupply.com', company: 'Sharma Electro Supply', category: 'Electrical', gst: '27AADCS5678B1ZQ', phone: '9876543211', rating: 4.8 },
    { first: 'Amit', last: 'Kumar', email: 'amit@buildmart.com', company: 'BuildMart Solutions', category: 'Furniture', gst: '06AADCK9012C1ZR', phone: '9876543212', rating: 3.5 },
  ];

  const vendors: any[] = [];
  for (const v of vendorData) {
    const user = await prisma.user.create({
      data: { firstName: v.first, lastName: v.last, email: v.email, passwordHash: hash, role: 'VENDOR', country: 'India' },
    });
    const vendor = await prisma.vendor.create({
      data: { userId: user.id, companyName: v.company, category: v.category, gstNumber: v.gst, contactPhone: v.phone, status: 'ACTIVE', rating: v.rating },
    });
    vendors.push({ ...vendor, user });
  }

  const now = new Date();
  const getPastDate = (monthsAgo: number, day = 15) => {
    const d = new Date();
    d.setMonth(now.getMonth() - monthsAgo);
    d.setDate(day);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  // ─────────────────────────────────────────
  // RFQ 1: IT & Electrical Hardware Q1 (Past - Closed)
  // ─────────────────────────────────────────
  const rfq1Date = getPastDate(3); // 3 months ago
  const rfq1 = await prisma.rFQ.create({
    data: {
      title: 'IT & Electrical Hardware Q1',
      category: 'Electrical',
      description: 'Laptops, routers and electrical cables for annex building.',
      deadline: getPastDate(3, 10),
      status: RFQStatus.CLOSED,
      createdById: officer.id,
      createdAt: rfq1Date,
    }
  });

  const rfq1Item1 = await prisma.rFQItem.create({
    data: { rfqId: rfq1.id, itemName: 'Category 6 Ethernet Cables (Bundles)', quantity: 50, unit: 'NOS' }
  });
  const rfq1Item2 = await prisma.rFQItem.create({
    data: { rfqId: rfq1.id, itemName: 'Unmanaged 24-Port Switch', quantity: 5, unit: 'NOS' }
  });

  // Invites
  await prisma.rFQVendorInvite.createMany({
    data: [
      { rfqId: rfq1.id, vendorId: vendors[1].id, status: 'SUBMITTED', invitedAt: rfq1Date }, // Priya (Electro)
      { rfqId: rfq1.id, vendorId: vendors[2].id, status: 'SUBMITTED', invitedAt: rfq1Date }, // Amit (BuildMart)
    ]
  });

  // Quotation 1 (Priya - Won)
  const q1Priya = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendors[1].id,
      status: QuotationStatus.ACCEPTED,
      deliveryDays: 7,
      gstRate: 18,
      taxType: 'GST_INTRA',
      subtotal: 150000,
      gstAmount: 27000,
      grandTotal: 177000,
      paymentTerms: 'Net 30',
      submittedAt: getPastDate(3, 5),
      createdAt: getPastDate(3, 5),
    }
  });
  await prisma.quotationItem.createMany({
    data: [
      { quotationId: q1Priya.id, rfqItemId: rfq1Item1.id, unitPrice: 2000, totalPrice: 100000 },
      { quotationId: q1Priya.id, rfqItemId: rfq1Item2.id, unitPrice: 10000, totalPrice: 50000 }
    ]
  });

  // Quotation 2 (Amit - Lost)
  const q1Amit = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      vendorId: vendors[2].id,
      status: QuotationStatus.REJECTED,
      deliveryDays: 14,
      gstRate: 18,
      taxType: 'GST_INTRA',
      subtotal: 160000,
      gstAmount: 28800,
      grandTotal: 188800,
      paymentTerms: 'Net 45',
      submittedAt: getPastDate(3, 6),
      createdAt: getPastDate(3, 6),
    }
  });

  // Approval
  const app1 = await prisma.approval.create({
    data: {
      rfqId: rfq1.id,
      quotationId: q1Priya.id,
      approverId: manager.id,
      status: ApprovalStatus.APPROVED,
      remarks: 'Electro supply offered lower pricing and faster delivery times.',
      decidedAt: getPastDate(3, 8),
      createdAt: getPastDate(3, 7),
    }
  });

  // Purchase Order
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0001',
      approvalId: app1.id,
      quotationId: q1Priya.id,
      vendorId: vendors[1].id,
      status: POStatus.RECEIVED,
      issuedAt: getPastDate(3, 8),
    }
  });
  const po1Item1 = await prisma.pOItem.create({
    data: { poId: po1.id, rfqItemId: rfq1Item1.id, quotationItemId: (await prisma.quotationItem.findFirst({ where: { quotationId: q1Priya.id, rfqItemId: rfq1Item1.id } }))!.id, quantity: 50, unitPrice: 2000, totalPrice: 100000 }
  });
  const po1Item2 = await prisma.pOItem.create({
    data: { poId: po1.id, rfqItemId: rfq1Item2.id, quotationItemId: (await prisma.quotationItem.findFirst({ where: { quotationId: q1Priya.id, rfqItemId: rfq1Item2.id } }))!.id, quantity: 5, unitPrice: 10000, totalPrice: 50000 }
  });

  // Invoice
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      poId: po1.id,
      vendorId: vendors[1].id,
      status: InvoiceStatus.PAID,
      dueDate: getPastDate(2, 8),
      taxType: 'GST_INTRA',
      gstRate: 18,
      subtotal: 150000,
      cgst: 13500,
      sgst: 13500,
      grandTotal: 177000,
      paidAt: getPastDate(2, 5),
      createdAt: getPastDate(3, 15),
    }
  });


  // ─────────────────────────────────────────
  // RFQ 2: Office Furniture Procurement Q2 (Recent - Closed)
  // ─────────────────────────────────────────
  const rfq2Date = getPastDate(1); // 1 month ago
  const rfq2 = await prisma.rFQ.create({
    data: {
      title: 'Office Furniture Procurement Q2',
      category: 'Furniture',
      description: 'Ergonomic chairs and desks for the 2nd floor team expansion.',
      deadline: getPastDate(1, 10),
      status: RFQStatus.CLOSED,
      createdById: officer.id,
      createdAt: rfq2Date,
    }
  });

  const rfq2Item1 = await prisma.rFQItem.create({
    data: { rfqId: rfq2.id, itemName: 'Ergonomic Task Chairs', quantity: 20, unit: 'NOS' }
  });
  const rfq2Item2 = await prisma.rFQItem.create({
    data: { rfqId: rfq2.id, itemName: 'Height Adjustable Desks', quantity: 10, unit: 'NOS' }
  });

  // Invites
  await prisma.rFQVendorInvite.createMany({
    data: [
      { rfqId: rfq2.id, vendorId: vendors[2].id, status: 'SUBMITTED', invitedAt: rfq2Date }, // Amit (BuildMart)
      { rfqId: rfq2.id, vendorId: vendors[0].id, status: 'SUBMITTED', invitedAt: rfq2Date }, // Rajesh (Steelworks)
    ]
  });

  // Quotation 3 (Amit - Won)
  const q2Amit = await prisma.quotation.create({
    data: {
      rfqId: rfq2.id,
      vendorId: vendors[2].id,
      status: QuotationStatus.ACCEPTED,
      deliveryDays: 10,
      gstRate: 18,
      taxType: 'GST_INTRA',
      subtotal: 120000,
      gstAmount: 21600,
      grandTotal: 141600,
      paymentTerms: 'Net 30',
      submittedAt: getPastDate(1, 5),
      createdAt: getPastDate(1, 5),
    }
  });
  await prisma.quotationItem.createMany({
    data: [
      { quotationId: q2Amit.id, rfqItemId: rfq2Item1.id, unitPrice: 3500, totalPrice: 70000 },
      { quotationId: q2Amit.id, rfqItemId: rfq2Item2.id, unitPrice: 5000, totalPrice: 50000 }
    ]
  });

  // Quotation 4 (Rajesh - Lost)
  const q2Rajesh = await prisma.quotation.create({
    data: {
      rfqId: rfq2.id,
      vendorId: vendors[0].id,
      status: QuotationStatus.REJECTED,
      deliveryDays: 15,
      gstRate: 18,
      taxType: 'GST_INTRA',
      subtotal: 130000,
      gstAmount: 23400,
      grandTotal: 153400,
      paymentTerms: 'Net 30',
      submittedAt: getPastDate(1, 6),
      createdAt: getPastDate(1, 6),
    }
  });

  // Approval
  const app2 = await prisma.approval.create({
    data: {
      rfqId: rfq2.id,
      quotationId: q2Amit.id,
      approverId: manager.id,
      status: ApprovalStatus.APPROVED,
      remarks: 'BuildMart offers competitive pricing on ergonomic items.',
      decidedAt: getPastDate(1, 8),
      createdAt: getPastDate(1, 7),
    }
  });

  // Purchase Order
  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0002',
      approvalId: app2.id,
      quotationId: q2Amit.id,
      vendorId: vendors[2].id,
      status: POStatus.ISSUED,
      issuedAt: getPastDate(1, 8),
    }
  });
  await prisma.pOItem.createMany({
    data: [
      { poId: po2.id, rfqItemId: rfq2Item1.id, quotationItemId: (await prisma.quotationItem.findFirst({ where: { quotationId: q2Amit.id, rfqItemId: rfq2Item1.id } }))!.id, quantity: 20, unitPrice: 3500, totalPrice: 70000 },
      { poId: po2.id, rfqItemId: rfq2Item2.id, quotationItemId: (await prisma.quotationItem.findFirst({ where: { quotationId: q2Amit.id, rfqItemId: rfq2Item2.id } }))!.id, quantity: 10, unitPrice: 5000, totalPrice: 50000 }
    ]
  });

  // Invoice (OVERDUE)
  const overdueInvoiceDueDate = new Date();
  overdueInvoiceDueDate.setDate(now.getDate() - 5); // 5 days overdue
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      poId: po2.id,
      vendorId: vendors[2].id,
      status: InvoiceStatus.OVERDUE,
      dueDate: overdueInvoiceDueDate,
      taxType: 'GST_INTRA',
      gstRate: 18,
      subtotal: 120000,
      cgst: 10800,
      sgst: 10800,
      grandTotal: 141600,
      createdAt: getPastDate(1, 15),
    }
  });


  // ─────────────────────────────────────────
  // RFQ 3: Structural Steel Supply (Active / Published)
  // ─────────────────────────────────────────
  const rfq3Date = new Date();
  rfq3Date.setDate(now.getDate() - 2);
  const rfq3Deadline = new Date();
  rfq3Deadline.setDate(now.getDate() + 6);

  const rfq3 = await prisma.rFQ.create({
    data: {
      title: 'Structural Steel Supply',
      category: 'Construction',
      description: 'IS 2062 Structural Steel I-Beams and Channels for Phase 2.',
      deadline: rfq3Deadline,
      status: RFQStatus.PUBLISHED,
      createdById: officer.id,
      createdAt: rfq3Date,
    }
  });

  const rfq3Item1 = await prisma.rFQItem.create({
    data: { rfqId: rfq3.id, itemName: 'Structural Steel I-Beams (Tons)', quantity: 10, unit: 'NOS' }
  });

  await prisma.rFQVendorInvite.createMany({
    data: [
      { rfqId: rfq3.id, vendorId: vendors[0].id, status: 'SUBMITTED', invitedAt: rfq3Date }, // Rajesh (Steelworks)
    ]
  });

  // Quotation 5 (Rajesh - Submitted, Awaiting decision)
  const q3Rajesh = await prisma.quotation.create({
    data: {
      rfqId: rfq3.id,
      vendorId: vendors[0].id,
      status: QuotationStatus.SUBMITTED,
      deliveryDays: 5,
      gstRate: 18,
      taxType: 'GST_INTRA',
      subtotal: 350000,
      gstAmount: 63000,
      grandTotal: 413000,
      paymentTerms: 'Net 15',
      submittedAt: new Date(),
      createdAt: new Date(),
    }
  });
  await prisma.quotationItem.create({
    data: { quotationId: q3Rajesh.id, rfqItemId: rfq3Item1.id, unitPrice: 35000, totalPrice: 350000 }
  });

  // Approval (Pending)
  await prisma.approval.create({
    data: {
      rfqId: rfq3.id,
      quotationId: q3Rajesh.id,
      status: ApprovalStatus.PENDING,
      createdAt: new Date(),
    }
  });


  // ─────────────────────────────────────────
  // Historical spend records (only invoices to construct a 6-month line graph)
  // We link these to dummy or past POs so DB integrity remains intact
  // ─────────────────────────────────────────
  
  // April RFQ, Quotation, PO & Invoice
  const rfqApril = await prisma.rFQ.create({
    data: {
      title: 'April Construction Materials',
      category: 'Construction',
      description: 'Cement and bricks for warehouse flooring.',
      deadline: getPastDate(2, 10),
      status: RFQStatus.CLOSED,
      createdById: officer.id,
      createdAt: getPastDate(2, 1),
    }
  });
  const rfqAprilItem = await prisma.rFQItem.create({
    data: { rfqId: rfqApril.id, itemName: 'Portland Cement Bags', quantity: 100, unit: 'NOS' }
  });
  await prisma.rFQVendorInvite.create({
    data: { rfqId: rfqApril.id, vendorId: vendors[0].id, status: 'SUBMITTED', invitedAt: getPastDate(2, 1) }
  });
  const qApril = await prisma.quotation.create({
    data: {
      rfqId: rfqApril.id,
      vendorId: vendors[0].id,
      status: QuotationStatus.ACCEPTED,
      deliveryDays: 5,
      gstRate: 18,
      taxType: 'GST_INTRA',
      subtotal: 220000,
      gstAmount: 39600,
      grandTotal: 259600,
      paymentTerms: 'Net 30',
      submittedAt: getPastDate(2, 5),
      createdAt: getPastDate(2, 5),
    }
  });
  const qAprilItem = await prisma.quotationItem.create({
    data: { quotationId: qApril.id, rfqItemId: rfqAprilItem.id, unitPrice: 2200, totalPrice: 220000 }
  });
  const appApril = await prisma.approval.create({
    data: {
      rfqId: rfqApril.id,
      quotationId: qApril.id,
      approverId: manager.id,
      status: ApprovalStatus.APPROVED,
      remarks: 'Approved for timely warehouse completion.',
      decidedAt: getPastDate(2, 8),
      createdAt: getPastDate(2, 7)
    }
  });
  const poApril = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0004',
      approvalId: appApril.id,
      quotationId: qApril.id,
      vendorId: vendors[0].id,
      status: POStatus.RECEIVED,
      issuedAt: getPastDate(2, 8)
    }
  });
  await prisma.pOItem.create({
    data: {
      poId: poApril.id,
      rfqItemId: rfqAprilItem.id,
      quotationItemId: qAprilItem.id,
      quantity: 100,
      unitPrice: 2200,
      totalPrice: 220000
    }
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0004',
      poId: poApril.id,
      vendorId: vendors[0].id,
      status: InvoiceStatus.PAID,
      dueDate: getPastDate(1, 8),
      subtotal: 220000,
      cgst: 19800,
      sgst: 19800,
      grandTotal: 259600,
      paidAt: getPastDate(2, 15),
      createdAt: getPastDate(2, 8),
    }
  });

  // May RFQ, Quotation, PO & Invoice
  const rfqMay = await prisma.rFQ.create({
    data: {
      title: 'May IT Infrastructure',
      category: 'Electrical',
      description: 'Office desktop monitors for development team.',
      deadline: getPastDate(1, 10),
      status: RFQStatus.CLOSED,
      createdById: officer.id,
      createdAt: getPastDate(1, 1),
    }
  });
  const rfqMayItem = await prisma.rFQItem.create({
    data: { rfqId: rfqMay.id, itemName: 'LED Desktop Monitors 24"', quantity: 15, unit: 'NOS' }
  });
  await prisma.rFQVendorInvite.create({
    data: { rfqId: rfqMay.id, vendorId: vendors[1].id, status: 'SUBMITTED', invitedAt: getPastDate(1, 1) }
  });
  const qMay = await prisma.quotation.create({
    data: {
      rfqId: rfqMay.id,
      vendorId: vendors[1].id,
      status: QuotationStatus.ACCEPTED,
      deliveryDays: 6,
      gstRate: 18,
      taxType: 'GST_INTRA',
      subtotal: 180000,
      gstAmount: 32400,
      grandTotal: 212400,
      paymentTerms: 'Net 30',
      submittedAt: getPastDate(1, 5),
      createdAt: getPastDate(1, 5),
    }
  });
  const qMayItem = await prisma.quotationItem.create({
    data: { quotationId: qMay.id, rfqItemId: rfqMayItem.id, unitPrice: 12000, totalPrice: 180000 }
  });
  const appMay = await prisma.approval.create({
    data: {
      rfqId: rfqMay.id,
      quotationId: qMay.id,
      approverId: manager.id,
      status: ApprovalStatus.APPROVED,
      remarks: 'Approved for engineering hires.',
      decidedAt: getPastDate(1, 8),
      createdAt: getPastDate(1, 7)
    }
  });
  const poMay = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0005',
      approvalId: appMay.id,
      quotationId: qMay.id,
      vendorId: vendors[1].id,
      status: POStatus.RECEIVED,
      issuedAt: getPastDate(1, 8)
    }
  });
  await prisma.pOItem.create({
    data: {
      poId: poMay.id,
      rfqItemId: rfqMayItem.id,
      quotationItemId: qMayItem.id,
      quantity: 15,
      unitPrice: 12000,
      totalPrice: 180000
    }
  });
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0005',
      poId: poMay.id,
      vendorId: vendors[1].id,
      status: InvoiceStatus.PAID,
      dueDate: getPastDate(0, 8),
      subtotal: 180000,
      cgst: 16200,
      sgst: 16200,
      grandTotal: 212400,
      paidAt: getPastDate(1, 15),
      createdAt: getPastDate(1, 8),
    }
  });


  // ─────────────────────────────────────────
  // GRN Records (for received POs)
  // ─────────────────────────────────────────
  const grn1 = await prisma.gRN.create({
    data: { poId: po1.id, status: 'VERIFIED', receivedAt: getPastDate(2, 20), createdAt: getPastDate(2, 18) }
  });
  await prisma.gRNItem.createMany({
    data: [
      { grnId: grn1.id, poItemId: po1Item1.id, qtyOrdered: 50, qtyReceived: 50 },
      { grnId: grn1.id, poItemId: po1Item2.id, qtyOrdered: 5, qtyReceived: 5 },
    ]
  });

  const grn2 = await prisma.gRN.create({
    data: { poId: poApril.id, status: 'VERIFIED', receivedAt: getPastDate(1, 25), createdAt: getPastDate(1, 22) }
  });
  const poAprilItems = await prisma.pOItem.findMany({ where: { poId: poApril.id } });
  await prisma.gRNItem.create({
    data: { grnId: grn2.id, poItemId: poAprilItems[0].id, qtyOrdered: 100, qtyReceived: 100 }
  });

  const grn3 = await prisma.gRN.create({
    data: { poId: poMay.id, status: 'SUBMITTED', receivedAt: getPastDate(0, 20), createdAt: getPastDate(0, 18) }
  });
  const poMayItems = await prisma.pOItem.findMany({ where: { poId: poMay.id } });
  await prisma.gRNItem.create({
    data: { grnId: grn3.id, poItemId: poMayItems[0].id, qtyOrdered: 15, qtyReceived: 15 }
  });

  // ─────────────────────────────────────────
  // Activity Logs — at least 1 per role
  // ─────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      // ADMIN actions
      { userId: admin.id, entityType: 'VENDOR', entityId: vendors[0].id, action: 'VENDOR_APPROVED', meta: JSON.stringify({ companyName: 'Patel Steelworks Pvt Ltd' }), createdAt: getPastDate(4, 2) },
      { userId: admin.id, entityType: 'VENDOR', entityId: vendors[1].id, action: 'VENDOR_APPROVED', meta: JSON.stringify({ companyName: 'Sharma Electro Supply' }), createdAt: getPastDate(4, 3) },
      { userId: admin.id, entityType: 'VENDOR', entityId: vendors[2].id, action: 'VENDOR_APPROVED', meta: JSON.stringify({ companyName: 'BuildMart Solutions' }), createdAt: getPastDate(4, 5) },
      // PROCUREMENT_OFFICER actions
      { userId: officer.id, entityType: 'RFQ', entityId: rfq1.id, action: 'RFQ_CREATED', createdAt: getPastDate(3, 1) },
      { userId: officer.id, entityType: 'RFQ', entityId: rfq1.id, action: 'RFQ_PUBLISHED', createdAt: getPastDate(3, 2) },
      { userId: officer.id, entityType: 'RFQ', entityId: rfq2.id, action: 'RFQ_CREATED', createdAt: getPastDate(1, 1) },
      { userId: officer.id, entityType: 'RFQ', entityId: rfq2.id, action: 'RFQ_PUBLISHED', createdAt: getPastDate(1, 2) },
      { userId: officer.id, entityType: 'PO', entityId: po1.id, action: 'PO_ISSUED', meta: JSON.stringify({ poNumber: 'PO-2026-0001' }), createdAt: getPastDate(3, 8) },
      { userId: officer.id, entityType: 'RFQ', entityId: rfq3.id, action: 'RFQ_PUBLISHED', createdAt: rfq3Date },
      // MANAGER actions
      { userId: manager.id, entityType: 'APPROVAL', entityId: app1.id, action: 'APPROVAL_APPROVED', meta: JSON.stringify({ rfqTitle: 'IT & Electrical Hardware Q1' }), createdAt: getPastDate(3, 8) },
      { userId: manager.id, entityType: 'APPROVAL', entityId: app2.id, action: 'APPROVAL_APPROVED', meta: JSON.stringify({ rfqTitle: 'Office Furniture Procurement Q2' }), createdAt: getPastDate(1, 8) },
      { userId: manager.id, entityType: 'GRN', entityId: grn1.id, action: 'GRN_VERIFIED', createdAt: getPastDate(2, 20) },
      // VENDOR actions
      { userId: vendors[1].userId, entityType: 'QUOTATION', entityId: q1Priya.id, action: 'QUOTATION_SUBMITTED', meta: JSON.stringify({ rfqTitle: 'IT & Electrical Hardware Q1', amount: 177000 }), createdAt: getPastDate(3, 5) },
      { userId: vendors[2].userId, entityType: 'QUOTATION', entityId: q2Amit.id, action: 'QUOTATION_SUBMITTED', meta: JSON.stringify({ rfqTitle: 'Office Furniture Procurement Q2', amount: 141600 }), createdAt: getPastDate(1, 5) },
      { userId: vendors[0].userId, entityType: 'QUOTATION', entityId: q3Rajesh.id, action: 'QUOTATION_SUBMITTED', meta: JSON.stringify({ rfqTitle: 'Structural Steel Supply', amount: 413000 }), createdAt: new Date() },
      { userId: vendors[0].userId, entityType: 'INVOICE', entityId: 'system', action: 'INVOICE_SENT', meta: JSON.stringify({ invoiceNumber: 'INV-2026-0004' }), createdAt: getPastDate(2, 9) },
      { userId: vendors[1].userId, entityType: 'INVOICE', entityId: 'system', action: 'INVOICE_SENT', meta: JSON.stringify({ invoiceNumber: 'INV-2026-0005' }), createdAt: getPastDate(1, 9) },
    ]
  });

  // ─────────────────────────────────────────
  // Notifications — at least 1 per role
  // ─────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      // ADMIN notifications
      { userId: admin.id, type: 'VENDOR_REGISTERED', title: 'New Vendor Registration', body: 'BuildMart Solutions has registered and is pending approval.', isRead: true, entityType: 'VENDOR', entityId: vendors[2].id, createdAt: getPastDate(4, 4) },
      { userId: admin.id, type: 'SYSTEM', title: 'System Health Check', body: 'Monthly system audit completed successfully. No issues detected.', isRead: false, createdAt: getPastDate(0, 1) },
      // PROCUREMENT_OFFICER notifications
      { userId: officer.id, type: 'QUOTATION_RECEIVED', title: 'New Quotation Received', body: 'Sharma Electro Supply submitted a quotation for IT & Electrical Hardware Q1.', isRead: true, entityType: 'QUOTATION', entityId: q1Priya.id, createdAt: getPastDate(3, 5) },
      { userId: officer.id, type: 'APPROVAL_DECIDED', title: 'Approval Granted', body: 'Manager approved the quotation for Office Furniture Procurement Q2.', isRead: true, entityType: 'APPROVAL', entityId: app2.id, createdAt: getPastDate(1, 8) },
      { userId: officer.id, type: 'QUOTATION_RECEIVED', title: 'New Quotation Received', body: 'Patel Steelworks submitted a quotation for Structural Steel Supply.', isRead: false, entityType: 'RFQ', entityId: rfq3.id },
      // MANAGER notifications
      { userId: manager.id, type: 'APPROVAL_NEEDED', title: 'Approval Required', body: 'Structural Steel Supply requires your approval.', isRead: false, entityType: 'APPROVAL', entityId: q3Rajesh.id },
      { userId: manager.id, type: 'APPROVAL_NEEDED', title: 'Approval Completed', body: 'You approved the quotation for IT & Electrical Hardware Q1.', isRead: true, entityType: 'APPROVAL', entityId: app1.id, createdAt: getPastDate(3, 8) },
      // VENDOR notifications (one per vendor)
      { userId: vendors[0].userId, type: 'RFQ_INVITE', title: 'New RFQ Invitation', body: 'You have been invited to submit a quotation for Structural Steel Supply.', isRead: true, entityType: 'RFQ', entityId: rfq3.id, createdAt: rfq3Date },
      { userId: vendors[0].userId, type: 'PO_ISSUED', title: 'Purchase Order Issued', body: 'PO-2026-0004 has been issued for April Construction Materials.', isRead: true, entityType: 'PO', entityId: poApril.id, createdAt: getPastDate(2, 8) },
      { userId: vendors[1].userId, type: 'RFQ_INVITE', title: 'New RFQ Invitation', body: 'You have been invited to submit a quotation for IT & Electrical Hardware Q1.', isRead: true, entityType: 'RFQ', entityId: rfq1.id, createdAt: getPastDate(3, 1) },
      { userId: vendors[1].userId, type: 'PO_ISSUED', title: 'Purchase Order Issued', body: 'PO-2026-0001 has been issued for IT & Electrical Hardware Q1.', isRead: true, entityType: 'PO', entityId: po1.id, createdAt: getPastDate(3, 8) },
      { userId: vendors[2].userId, type: 'RFQ_INVITE', title: 'New RFQ Invitation', body: 'You have been invited to submit a quotation for Office Furniture Procurement Q2.', isRead: true, entityType: 'RFQ', entityId: rfq2.id, createdAt: getPastDate(1, 1) },
      { userId: vendors[2].userId, type: 'INVOICE_OVERDUE', title: 'Invoice Overdue', body: 'Invoice INV-2026-0002 for Office Furniture is overdue by 5 days.', isRead: false, entityType: 'INVOICE', entityId: po2.id },
    ]
  });

  console.log('✅ Seeding complete!');
  console.log('   All standard user passwords: Password123!');
  console.log('   Admin:   admin@vendorbridge.com');
  console.log('   Officer: officer@vendorbridge.com');
  console.log('   Manager: manager@vendorbridge.com');
  console.log('   Vendors: rajesh@steelworks.com / priya@electrosupply.com / amit@buildmart.com');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
