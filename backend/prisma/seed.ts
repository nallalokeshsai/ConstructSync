import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ConstructSync Database with realistic Indian ConTech data...');

  // 1. Clean existing records in correct order
  await prisma.auditLog.deleteMany({});
  await prisma.vendorPerformance.deleteMany({});
  await prisma.complianceDocument.deleteMany({});
  await prisma.vendorQuote.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.gRNItem.deleteMany({});
  await prisma.gRN.deleteMany({});
  await prisma.pOItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.indentItem.deleteMany({});
  await prisma.indent.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 2. Create Users & Personas
  const meena = await prisma.user.create({
    data: {
      email: 'meena.director@constructsync.in',
      name: 'Meena Iyer',
      password: passwordHash,
      role: 'project_director',
      phone: '+91 98201 11223',
      designation: 'Project Director (Portfolio Head)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const rajesh = await prisma.user.create({
    data: {
      email: 'rajesh.procurement@constructsync.in',
      name: 'Rajesh Sharma',
      password: passwordHash,
      role: 'procurement_manager',
      phone: '+91 98450 44556',
      designation: 'Senior Procurement Manager',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    },
  });

  const ankit = await prisma.user.create({
    data: {
      email: 'ankit.site@constructsync.in',
      name: 'Ankit Verma',
      password: passwordHash,
      role: 'site_engineer',
      phone: '+91 97110 77889',
      designation: 'Lead Site Engineer',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    },
  });

  const finance = await prisma.user.create({
    data: {
      email: 'finance@constructsync.in',
      name: 'Pooja Agarwal',
      password: passwordHash,
      role: 'finance_controller',
      phone: '+91 98220 33445',
      designation: 'Chief Financial Controller',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@constructsync.in',
      name: 'System Administrator',
      password: passwordHash,
      role: 'admin',
      phone: '+91 99000 00001',
      designation: 'VP of Engineering & Systems',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('✅ Users created');

  // 3. Create Projects
  const p1 = await prisma.project.create({
    data: {
      projectName: 'Skyline Heights Phase-2',
      projectCode: 'PRJ-BLR-002',
      location: 'Whitefield, Bengaluru, Karnataka',
      totalBudget: 120000000,
      procurementBudget: 55000000,
      startDate: new Date('2025-01-10'),
      expectedEndDate: new Date('2026-12-31'),
      projectManagerId: meena.id,
      status: 'active',
    },
  });

  const p2 = await prisma.project.create({
    data: {
      projectName: 'Prestige Tech Park Block D',
      projectCode: 'PRJ-HYD-014',
      location: 'Hitec City, Hyderabad, Telangana',
      totalBudget: 185000000,
      procurementBudget: 92000000,
      startDate: new Date('2025-03-01'),
      expectedEndDate: new Date('2027-06-30'),
      projectManagerId: meena.id,
      status: 'active',
    },
  });

  const p3 = await prisma.project.create({
    data: {
      projectName: 'Greenfield Logistics Hub',
      projectCode: 'PRJ-PUN-008',
      location: 'Chakan Industrial Area, Pune, Maharashtra',
      totalBudget: 65000000,
      procurementBudget: 32000000,
      startDate: new Date('2025-06-15'),
      expectedEndDate: new Date('2026-08-30'),
      projectManagerId: meena.id,
      status: 'active',
    },
  });

  const p4 = await prisma.project.create({
    data: {
      projectName: 'Metro Line 3 Casting Yard',
      projectCode: 'PRJ-MUM-021',
      location: 'Bandra-Kurla Complex, Mumbai, Maharashtra',
      totalBudget: 240000000,
      procurementBudget: 130000000,
      startDate: new Date('2024-11-01'),
      expectedEndDate: new Date('2026-10-31'),
      projectManagerId: meena.id,
      status: 'active',
    },
  });

  console.log('✅ Projects created');

  // 4. Create Vendors
  const vTata = await prisma.vendor.create({
    data: {
      companyName: 'Tata Tiscon Rebar Pvt Ltd',
      contactPerson: 'Sunil Nair',
      phone: '+91 98450 12345',
      email: 'orders@tatatiscon-distributors.in',
      gstin: '29AAACT2727Q1ZB',
      pan: 'AAACT2727Q',
      bankName: 'HDFC Bank Ltd',
      bankAccount: '50200012345678',
      ifscCode: 'HDFC0000123',
      category: 'Steel',
      city: 'Bengaluru',
      state: 'Karnataka',
      complianceStatus: 'compliant',
      performanceScore: 4.85,
      status: 'active',
    },
  });

  const vUltra = await prisma.vendor.create({
    data: {
      companyName: 'UltraTech Cement Distributors',
      contactPerson: 'Vikram Joshi',
      phone: '+91 98200 98765',
      email: 'sales@ultratech-direct.com',
      gstin: '27AABCU9876R1Z4',
      pan: 'AABCU9876R',
      bankName: 'ICICI Bank',
      bankAccount: '000405112233',
      ifscCode: 'ICIC0000004',
      category: 'Cement',
      city: 'Mumbai',
      state: 'Maharashtra',
      complianceStatus: 'compliant',
      performanceScore: 4.60,
      status: 'active',
    },
  });

  const vApar = await prisma.vendor.create({
    data: {
      companyName: 'Apar Electricals & Cables Ltd',
      contactPerson: 'Karan Shah',
      phone: '+91 98250 55441',
      email: 'industrial@aparelec.in',
      gstin: '24AABCA5544N1Z1',
      pan: 'AABCA5544N',
      bankName: 'State Bank of India',
      bankAccount: '310988776655',
      ifscCode: 'SBIN0001234',
      category: 'Electrical',
      city: 'Ahmedabad',
      state: 'Gujarat',
      complianceStatus: 'expiring', // Document expiring in 14 days
      performanceScore: 3.90,
      status: 'active',
    },
  });

  const vSupreme = await prisma.vendor.create({
    data: {
      companyName: 'Supreme Piping & Sanware Ltd',
      contactPerson: 'Ramesh Patel',
      phone: '+91 98211 44332',
      email: 'projects@supremepipes.in',
      gstin: '27AAACS1122L1Z8',
      pan: 'AAACS1122L',
      bankName: 'Axis Bank',
      bankAccount: '912010023456789',
      ifscCode: 'UTIB0000125',
      category: 'Plumbing',
      city: 'Pune',
      state: 'Maharashtra',
      complianceStatus: 'compliant',
      performanceScore: 4.40,
      status: 'active',
    },
  });

  const vDeccan = await prisma.vendor.create({
    data: {
      companyName: 'Deccan Sand & Aggregates Quarry',
      contactPerson: 'Gowda Mallesh',
      phone: '+91 94480 33221',
      email: 'billing@deccanaggregates.in',
      gstin: '29AAACD3344M1Z2',
      pan: 'AAACD3344M',
      bankName: 'Canara Bank',
      bankAccount: '0456101009876',
      ifscCode: 'CNRB0000456',
      category: 'Sand',
      city: 'Bengaluru',
      state: 'Karnataka',
      complianceStatus: 'non_compliant', // GST return default
      performanceScore: 2.70,
      status: 'active',
    },
  });

  const vJindal = await prisma.vendor.create({
    data: {
      companyName: 'Jindal Steel & Structures Ltd',
      contactPerson: 'Alok Singhal',
      phone: '+91 99100 88990',
      email: 'infra@jindalsteel.com',
      gstin: '06AAACJ8899K1Z5',
      pan: 'AAACJ8899K',
      bankName: 'Kotak Mahindra Bank',
      bankAccount: '7788990011',
      ifscCode: 'KKBK0000180',
      category: 'Steel',
      city: 'Gurugram',
      state: 'Haryana',
      complianceStatus: 'compliant',
      performanceScore: 4.75,
      status: 'active',
    },
  });

  const vKajaria = await prisma.vendor.create({
    data: {
      companyName: 'Kajaria Vitrified Tiles & Stones',
      contactPerson: 'Deepak Saxena',
      phone: '+91 98112 33445',
      email: 'corp@kajariaceramics.com',
      gstin: '08AAACK4455P1Z3',
      pan: 'AAACK4455P',
      bankName: 'Punjab National Bank',
      bankAccount: '1234002100056789',
      ifscCode: 'PUNB0123400',
      category: 'Tiles',
      city: 'Jaipur',
      state: 'Rajasthan',
      complianceStatus: 'compliant',
      performanceScore: 4.50,
      status: 'active',
    },
  });

  console.log('✅ Vendors created');

  // 5. Create Compliance Documents
  const now = new Date();
  const inTenDays = new Date();
  inTenDays.setDate(now.getDate() + 10);
  const inSixMonths = new Date();
  inSixMonths.setDate(now.getDate() + 180);
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setDate(now.getDate() - 60);

  await prisma.complianceDocument.createMany({
    data: [
      {
        vendorId: vTata.id,
        documentType: 'gst_cert',
        title: 'GST Registration Certificate REG-06',
        documentNumber: '29AAACT2727Q1ZB',
        issueDate: twoMonthsAgo,
        expiryDate: inSixMonths,
        status: 'valid',
      },
      {
        vendorId: vTata.id,
        documentType: 'insurance',
        title: 'Comprehensive Transit Insurance Policy',
        documentNumber: 'POL-ICICI-2025-889',
        issueDate: twoMonthsAgo,
        expiryDate: inSixMonths,
        status: 'valid',
      },
      {
        vendorId: vApar.id,
        documentType: 'gst_cert',
        title: 'GST Annual Renewal Filing',
        documentNumber: '24AABCA5544N1Z1',
        issueDate: twoMonthsAgo,
        expiryDate: inTenDays, // Expiring alert!
        status: 'expiring',
      },
      {
        vendorId: vDeccan.id,
        documentType: 'gst_cert',
        title: 'Pollution Control & Mining License',
        documentNumber: 'PCB-KA-2023-41',
        issueDate: twoMonthsAgo,
        expiryDate: twoMonthsAgo, // Expired!
        status: 'expired',
      },
    ],
  });

  // 6. Vendor Quotes (for side-by-side rate intelligence)
  await prisma.vendorQuote.createMany({
    data: [
      {
        vendorId: vTata.id,
        materialName: 'Fe550D TMT Rebar (16mm)',
        materialCategory: 'Steel',
        unitRate: 62500,
        unit: 'MT',
        leadTimeDays: 3,
        minimumOrderQuantity: 10,
        notes: 'Primary producer, BIS certified with test certificates',
      },
      {
        vendorId: vJindal.id,
        materialName: 'Fe550D TMT Rebar (16mm)',
        materialCategory: 'Steel',
        unitRate: 61800,
        unit: 'MT',
        leadTimeDays: 5,
        minimumOrderQuantity: 20,
        notes: 'Factory direct dispatch from Angul plant',
      },
      {
        vendorId: vUltra.id,
        materialName: 'OPC 53 Grade Cement',
        materialCategory: 'Cement',
        unitRate: 385,
        unit: 'bag',
        leadTimeDays: 2,
        minimumOrderQuantity: 200,
        notes: 'Fresh lot with tamper-proof packaging',
      },
      {
        vendorId: vSupreme.id,
        materialName: 'CPVC SDR 11 Pipes (1 inch)',
        materialCategory: 'Plumbing',
        unitRate: 480,
        unit: 'meter',
        leadTimeDays: 4,
        minimumOrderQuantity: 50,
        notes: 'Chlorinated polyvinyl chloride high temperature rated',
      },
    ],
  });

  // 7. Create Indents
  // Indent 1: Approved steel indent for Skyline Heights (Value > 1L, Director approved)
  const indent1 = await prisma.indent.create({
    data: {
      indentNumber: 'IND-2026-00101',
      projectId: p1.id,
      requestedById: ankit.id,
      requiredDate: new Date('2026-04-10'),
      priority: 'urgent',
      approvalStatus: 'approved',
      approvedById: meena.id,
      approvedAt: new Date(),
      approvalComments: 'Urgent slab casting schedule requirement. Approved.',
      notes: 'Required for Tower A Level 8 slab reinforcement.',
      items: {
        create: [
          {
            materialName: 'Fe550D TMT Rebar (16mm)',
            materialCategory: 'Steel',
            quantity: 50,
            unit: 'MT',
            estimatedRate: 62500,
            notes: 'Primary brand only (Tata or Jindal)',
          },
          {
            materialName: 'Fe550D TMT Rebar (12mm)',
            materialCategory: 'Steel',
            quantity: 30,
            unit: 'MT',
            estimatedRate: 63000,
            notes: 'Column ties and distribution bars',
          },
        ],
      },
    },
  });

  // Indent 2: Cement indent approved by PM (Rajesh) for Prestige Tech Park
  const indent2 = await prisma.indent.create({
    data: {
      indentNumber: 'IND-2026-00102',
      projectId: p2.id,
      requestedById: ankit.id,
      requiredDate: new Date('2026-04-15'),
      priority: 'normal',
      approvalStatus: 'approved',
      approvedById: rajesh.id,
      approvedAt: new Date(),
      approvalComments: 'Approved within procurement monthly budget.',
      notes: 'Superstructure column concrete mix batching.',
      items: {
        create: [
          {
            materialName: 'OPC 53 Grade Cement',
            materialCategory: 'Cement',
            quantity: 800,
            unit: 'bags',
            estimatedRate: 385,
            notes: 'Delivery in covered trailer trucks',
          },
        ],
      },
    },
  });

  // Indent 3: Pending indent (waiting for approval, escalation alert)
  const indent3 = await prisma.indent.create({
    data: {
      indentNumber: 'IND-2026-00103',
      projectId: p3.id,
      requestedById: ankit.id,
      requiredDate: new Date('2026-04-20'),
      priority: 'urgent',
      approvalStatus: 'pending',
      notes: 'Electrical conduit pipes and heavy copper feeder cables for Substation-1.',
      items: {
        create: [
          {
            materialName: 'FRLS Copper Armoured Cable 4C x 50 sq.mm',
            materialCategory: 'Electrical',
            quantity: 450,
            unit: 'meters',
            estimatedRate: 1450,
            notes: 'Flame retardant low smoke compliance mandatory',
          },
        ],
      },
    },
  });

  // Indent 4: Plumbing indent pending review
  await prisma.indent.create({
    data: {
      indentNumber: 'IND-2026-00104',
      projectId: p1.id,
      requestedById: ankit.id,
      requiredDate: new Date('2026-04-28'),
      priority: 'normal',
      approvalStatus: 'pending',
      notes: 'Plumbing stack lines and drainage traps for basement car park.',
      items: {
        create: [
          {
            materialName: 'SWR PVC Pipes 110mm Type B',
            materialCategory: 'Plumbing',
            quantity: 220,
            unit: 'pieces',
            estimatedRate: 850,
          },
        ],
      },
    },
  });

  console.log('✅ Indents created');

  // 8. Create Purchase Orders
  // PO 1: Matched case - Tata Steel for Skyline Heights
  const po1Total = 50 * 62500 + 30 * 63000; // 3,125,000 + 1,890,000 = 5,015,000
  const po1Gst = po1Total * 0.18; // 902,700
  const po1Grand = po1Total + po1Gst; // 5,917,700

  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0081',
      indentId: indent1.id,
      vendorId: vTata.id,
      projectId: p1.id,
      totalAmount: po1Total,
      gstAmount: po1Gst,
      grandTotal: po1Grand,
      deliveryDate: new Date('2026-04-12'),
      paymentTerms: '30 Days Net from GRN Date',
      status: 'delivered',
      createdById: rajesh.id,
      isMaverick: false,
      notes: 'Standard contract rate applied. Delivery directly at Site Gate 2.',
      items: {
        create: [
          {
            materialName: 'Fe550D TMT Rebar (16mm)',
            quantity: 50,
            unit: 'MT',
            unitRate: 62500,
            gstPercentage: 18,
            totalAmount: 50 * 62500,
          },
          {
            materialName: 'Fe550D TMT Rebar (12mm)',
            quantity: 30,
            unit: 'MT',
            unitRate: 63000,
            gstPercentage: 18,
            totalAmount: 30 * 63000,
          },
        ],
      },
    },
    include: { items: true },
  });

  // PO 2: Discrepancy Case - UltraTech Cement with Partial Rejection
  const po2Total = 800 * 385; // 308,000
  const po2Gst = po2Total * 0.28; // 86,240 (28% GST on cement)
  const po2Grand = po2Total + po2Gst; // 394,240

  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0082',
      indentId: indent2.id,
      vendorId: vUltra.id,
      projectId: p2.id,
      totalAmount: po2Total,
      gstAmount: po2Gst,
      grandTotal: po2Grand,
      deliveryDate: new Date('2026-04-16'),
      paymentTerms: '15 Days Net',
      status: 'delivered',
      createdById: rajesh.id,
      isMaverick: false,
      notes: 'Strict inspection for moisture hardening required at site laboratory.',
      items: {
        create: [
          {
            materialName: 'OPC 53 Grade Cement',
            quantity: 800,
            unit: 'bags',
            unitRate: 385,
            gstPercentage: 28,
            totalAmount: 800 * 385,
          },
        ],
      },
    },
    include: { items: true },
  });

  // PO 3: Active in-transit PO
  const po3 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0083',
      vendorId: vSupreme.id,
      projectId: p1.id,
      totalAmount: 240000,
      gstAmount: 43200,
      grandTotal: 283200,
      deliveryDate: new Date('2026-04-22'),
      paymentTerms: 'On Delivery',
      status: 'sent',
      createdById: rajesh.id,
      isMaverick: false,
      notes: 'Basement fire sprinkler CPVC piping.',
      items: {
        create: [
          {
            materialName: 'CPVC SDR 11 Pipes (1 inch)',
            quantity: 500,
            unit: 'meter',
            unitRate: 480,
            gstPercentage: 18,
            totalAmount: 240000,
          },
        ],
      },
    },
  });

  // PO 4: Maverick Spend Case! (Purchased off-contract at higher rate without indent)
  const po4 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-0084',
      vendorId: vDeccan.id,
      projectId: p3.id,
      totalAmount: 680000,
      gstAmount: 34000,
      grandTotal: 714000,
      deliveryDate: new Date('2026-04-05'),
      paymentTerms: 'Immediate Cheque',
      status: 'acknowledged',
      createdById: rajesh.id,
      isMaverick: true, // Tagged as maverick spend
      notes: 'Emergency purchase made directly without approved indent due to local quarry strike.',
      items: {
        create: [
          {
            materialName: 'M-Sand (Manufactured Sand)',
            quantity: 400,
            unit: 'ton',
            unitRate: 1700, // inflated rate compared to 1350 contract rate
            gstPercentage: 5,
            totalAmount: 680000,
          },
        ],
      },
    },
  });

  console.log('✅ Purchase Orders created');

  // 9. Create GRNs (Goods Receipt Notes)
  // GRN 1: Full acceptance for PO 1 (Tata Steel)
  const grn1 = await prisma.gRN.create({
    data: {
      grnNumber: 'GRN-2026-0041',
      poId: po1.id,
      receivedById: ankit.id,
      receivedDate: new Date('2026-04-12'),
      deliveryChallanNo: 'DC-TATA-88912',
      vehicleNumber: 'KA-01-MJ-9912',
      qualityStatus: 'accepted',
      notes: 'Weight bridge slips verified. Mill test cert batch #TC-991 passed tension test.',
      photoUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&auto=format&fit=crop&q=80',
      ]),
      items: {
        create: [
          {
            poItemId: po1.items[0].id,
            materialName: 'Fe550D TMT Rebar (16mm)',
            orderedQuantity: 50,
            receivedQuantity: 50,
            acceptedQuantity: 50,
            rejectedQuantity: 0,
            remarks: 'Weighbridge calibrated and verified.',
          },
          {
            poItemId: po1.items[1].id,
            materialName: 'Fe550D TMT Rebar (12mm)',
            orderedQuantity: 30,
            receivedQuantity: 30,
            acceptedQuantity: 30,
            rejectedQuantity: 0,
            remarks: 'Bundle tags intact.',
          },
        ],
      },
    },
  });

  // GRN 2: Partial acceptance for PO 2 (UltraTech Cement) - 60 bags damaged by rain during transit!
  const grn2 = await prisma.gRN.create({
    data: {
      grnNumber: 'GRN-2026-0042',
      poId: po2.id,
      receivedById: ankit.id,
      receivedDate: new Date('2026-04-16'),
      deliveryChallanNo: 'DC-UTC-55410',
      vehicleNumber: 'MH-12-PQ-4412',
      qualityStatus: 'partial',
      rejectionReason: '60 bags hardened due to moisture leakage from torn tarpaulin during rain.',
      notes: 'Vendor driver signed acknowledgment slip for 60 rejected bags.',
      photoUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80',
      ]),
      items: {
        create: [
          {
            poItemId: po2.items[0].id,
            materialName: 'OPC 53 Grade Cement',
            orderedQuantity: 800,
            receivedQuantity: 800,
            acceptedQuantity: 740,
            rejectedQuantity: 60,
            remarks: '740 bags stacked in dry warehouse. 60 bags quarantined and returned.',
          },
        ],
      },
    },
  });

  console.log('✅ GRNs created');

  // 10. Invoices & 3-Way Matching
  // Invoice 1: Perfectly Matched (Tata Steel for PO 1)
  const inv1Gst = po1Gst;
  const inv1Tds = po1Total * 0.02; // 2% TDS u/s 194C
  const inv1Net = po1Grand - inv1Tds;

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-TATA-2026-901',
      vendorId: vTata.id,
      poId: po1.id,
      grnId: grn1.id,
      invoiceAmount: po1Total,
      gstAmount: inv1Gst,
      tdsPercentage: 2.0,
      tdsAmount: inv1Tds,
      netPayable: inv1Net,
      invoiceDate: new Date('2026-04-13'),
      dueDate: new Date('2026-05-13'),
      paymentStatus: 'approved',
      threeWayMatchStatus: 'matched',
      notes: 'Exact match between PO, GRN, and Tax Invoice. Clean 3-way match passed.',
    },
  });

  // Invoice 2: Mismatch Discrepancy! (UltraTech billed for 800 bags instead of 740 accepted bags)
  // Vendor sent invoice for full PO quantity 800 bags @ 385 = 308,000 + 28% GST = 394,240
  // But GRN accepted is only 740 bags!
  const inv2Amount = 308000;
  const inv2Gst = 86240;
  const inv2Tds = inv2Amount * 0.02;
  const inv2Net = inv2Amount + inv2Gst - inv2Tds;

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-UTC-2026-339',
      vendorId: vUltra.id,
      poId: po2.id,
      grnId: grn2.id,
      invoiceAmount: inv2Amount,
      gstAmount: inv2Gst,
      tdsPercentage: 2.0,
      tdsAmount: inv2Tds,
      netPayable: inv2Net,
      invoiceDate: new Date('2026-04-17'),
      dueDate: new Date('2026-05-02'),
      paymentStatus: 'disputed',
      threeWayMatchStatus: 'mismatch',
      matchDiscrepancies: JSON.stringify({
        quantityMismatch: {
          ordered: 800,
          grnAccepted: 740,
          invoiced: 800,
          discrepancy: 60,
          unit: 'bags',
          impactAmount: 60 * 385 * 1.28, // ₹29,568 overbilled
          description: 'Invoice billed for 800 bags, but GRN-2026-0042 records 60 rejected bags due to moisture hardening. Credit note of ₹29,568 requested.',
        },
      }),
      notes: 'Disputed by finance. Credit note requested from UltraTech before releasing payment.',
    },
  });

  console.log('✅ Invoices & 3-Way Matching records created');

  // 11. Vendor Performance Logs
  await prisma.vendorPerformance.createMany({
    data: [
      {
        vendorId: vTata.id,
        projectId: p1.id,
        poId: po1.id,
        deliveryTimelinessScore: 4.9,
        qualityScore: 5.0,
        pricingCompetitiveness: 4.6,
        communicationScore: 4.9,
        overallScore: 4.85,
        reviewNotes: 'Delivered before scheduled cutoff. Test certificate batch was spotless.',
        reviewedById: rajesh.id,
      },
      {
        vendorId: vUltra.id,
        projectId: p2.id,
        poId: po2.id,
        deliveryTimelinessScore: 4.8,
        qualityScore: 4.2, // lowered due to transit moisture damage
        pricingCompetitiveness: 4.7,
        communicationScore: 4.7,
        overallScore: 4.6,
        reviewNotes: 'Driver acknowledged 60 damaged bags promptly, but transit tarpaulin standards must improve.',
        reviewedById: rajesh.id,
      },
      {
        vendorId: vDeccan.id,
        projectId: p3.id,
        poId: po4.id,
        deliveryTimelinessScore: 2.5,
        qualityScore: 2.8,
        pricingCompetitiveness: 2.4, // high off-contract pricing
        communicationScore: 3.1,
        overallScore: 2.7,
        reviewNotes: 'Unreliable lead times and non-responsive dispatch desk.',
        reviewedById: rajesh.id,
      },
    ],
  });

  // 12. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: ankit.id,
        action: 'INDENT_CREATED',
        entity: 'Indent',
        entityId: indent1.id,
        details: JSON.stringify({ indentNumber: 'IND-2026-00101', priority: 'urgent', itemsCount: 2 }),
      },
      {
        userId: meena.id,
        action: 'INDENT_APPROVED',
        entity: 'Indent',
        entityId: indent1.id,
        details: JSON.stringify({ indentNumber: 'IND-2026-00101', threshold: '> ₹1,00,000', approvedBy: 'Meena Iyer (Director)' }),
      },
      {
        userId: rajesh.id,
        action: 'PO_GENERATED',
        entity: 'PurchaseOrder',
        entityId: po1.id,
        details: JSON.stringify({ poNumber: 'PO-2026-0081', vendor: 'Tata Tiscon Rebar Pvt Ltd', grandTotal: 5917700 }),
      },
      {
        userId: ankit.id,
        action: 'GRN_LOGGED',
        entity: 'GRN',
        entityId: grn1.id,
        details: JSON.stringify({ grnNumber: 'GRN-2026-0041', status: 'accepted', challan: 'DC-TATA-88912' }),
      },
      {
        userId: finance.id,
        action: '3WAY_MATCH_VERIFIED',
        entity: 'Invoice',
        entityId: 'INV-TATA-2026-901',
        details: JSON.stringify({ invoiceNumber: 'INV-TATA-2026-901', matchStatus: 'matched', netPayable: inv1Net }),
      },
      {
        userId: finance.id,
        action: '3WAY_MATCH_DISCREPANCY_FLAGGED',
        entity: 'Invoice',
        entityId: 'INV-UTC-2026-339',
        details: JSON.stringify({
          invoiceNumber: 'INV-UTC-2026-339',
          matchStatus: 'mismatch',
          reason: 'Quantity mismatch: 60 bags rejected in GRN but invoiced',
        }),
      },
    ],
  });

  console.log('✅ Audit logs created');
  console.log('🎉 ConstructSync database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
