import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const OUR_COMPANY_GSTIN = '27AAACG1234F1Z5'; // Our Enterprise in Maharashtra (State Code 27)

type RuleStatus = 'PASS' | 'WARNING' | 'FAIL' | 'CRITICAL';

interface TriggeredRule {
  code: string;
  category: string;
  name: string;
  status: RuleStatus;
  score: number;
  details: string;
  detected?: string;
  expected?: string;
}

interface MediumCase {
  invNum: string;
  vendor: string;
  date: Date;
  taxable: number;
  rate: number;
  isInter: boolean;
  desc: string;
  hsn: string;
  score: number;
  rules: TriggeredRule[];
}

interface HighCase {
  invNum: string;
  vendor: string;
  poNumber?: string;
  date: Date;
  taxable: number;
  rate: number;
  isInter: boolean;
  desc: string;
  hsn: string;
  score: number;
  overrideCgst?: number;
  overrideSgst?: number;
  overrideVendorGstin?: string;
  rules: TriggeredRule[];
  alert?: {
    type: string;
    severity: string;
    title: string;
    description: string;
  };
}

interface CriticalCase {
  invNum: string;
  vendor: string;
  date: Date;
  taxable: number;
  rate: number;
  isInter: boolean;
  desc: string;
  hsn: string;
  score: number;
  overrideGrandTotal?: number;
  overrideVendorGstin?: string;
  rules: TriggeredRule[];
  alert: {
    type: string;
    severity: string;
    title: string;
    description: string;
  };
}

async function main() {
  console.log('🔄 Cleaning existing database...');
  await prisma.auditLog.deleteMany();
  await prisma.fraudRuleResult.deleteMany();
  await prisma.fraudAlert.deleteMany();
  await prisma.fraudDetection.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  console.log('👥 Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const auditorPassword = await bcrypt.hash('Audit@123', salt);
  const financePassword = await bcrypt.hash('Finance@123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Vikramaditya Singhania',
      email: 'admin@fraudshield.in',
      passwordHash: adminPassword,
      role: 'ADMIN',
      department: 'Corporate Governance & Risk',
      phone: '+91 98201 11223',
    },
  });

  const auditor = await prisma.user.create({
    data: {
      name: 'Ananya Sharma (CA)',
      email: 'auditor.sharma@fraudshield.in',
      passwordHash: auditorPassword,
      role: 'AUDITOR',
      department: 'Internal Audit & Forensic Review',
      phone: '+91 98112 33445',
    },
  });

  const financeUser = await prisma.user.create({
    data: {
      name: 'Rajesh Patel',
      email: 'finance.patel@fraudshield.in',
      passwordHash: financePassword,
      role: 'FINANCE_USER',
      department: 'Accounts Payable & Billing',
      phone: '+91 97234 55667',
    },
  });

  console.log('🏢 Seeding Indian Vendors...');
  const vendorData = [
    {
      name: 'Tata Steel Supplies Ltd',
      legalName: 'Tata Steel Supplies Limited',
      gstin: '27AAACT2727Q1ZW',
      pan: 'AAACT2727Q',
      email: 'sales@tatasteelsupplies.in',
      phone: '+91 22 6665 8282',
      address: 'Bombay House, 24 Homi Mody Street, Fort',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400001',
      isVerified: true,
      riskScore: 4.2,
      totalInvoicesCount: 14,
      totalAmountBilled: 4250000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Infosys Digital Logistics Pvt Ltd',
      legalName: 'Infosys Digital Logistics Private Limited',
      gstin: '29AAACI4912H1ZK',
      pan: 'AAACI4912H',
      email: 'billing@infosyslogistics.com',
      phone: '+91 80 2852 0261',
      address: 'Electronics City, Hosur Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560100',
      isVerified: true,
      riskScore: 2.5,
      totalInvoicesCount: 10,
      totalAmountBilled: 2840000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Bharat Heavy Machinery & Spares',
      legalName: 'Bharat Heavy Machinery and Spares Corp',
      gstin: '07AAACB2233M1Z8',
      pan: 'AAACB2233M',
      email: 'accounts@bhmspares.in',
      phone: '+91 11 2336 4455',
      address: 'Barakhamba Road, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      pincode: '110001',
      isVerified: true,
      riskScore: 6.0,
      totalInvoicesCount: 8,
      totalAmountBilled: 1980000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Reliance Polychem Enterprises',
      legalName: 'Reliance Polychem Industrial Enterprises Ltd',
      gstin: '24AAACR1234F1ZQ',
      pan: 'AAACR1234F',
      email: 'support@reliancepolychem.co.in',
      phone: '+91 265 223 4567',
      address: 'GIDC Industrial Estate, Makarpura',
      city: 'Vadodara',
      state: 'Gujarat',
      stateCode: '24',
      pincode: '390010',
      isVerified: true,
      riskScore: 8.0,
      totalInvoicesCount: 9,
      totalAmountBilled: 3120000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Larsen Tech Infrastructures',
      legalName: 'Larsen Tech Infrastructure Services Ltd',
      gstin: '27AAACL5678P1Z3',
      pan: 'AAACL5678P',
      email: 'procurement@larseninfra.in',
      phone: '+91 22 6752 5656',
      address: 'L&T House, Ballard Estate',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400001',
      isVerified: true,
      riskScore: 3.5,
      totalInvoicesCount: 7,
      totalAmountBilled: 2450000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Sharma Electricals & Hardware',
      legalName: 'Sharma Electricals & Hardware Mart',
      gstin: '06AAAFS4455K1Z9',
      pan: 'AAAFS4455K',
      email: 'sharma.electricals@gmail.com',
      phone: '+91 124 456 7890',
      address: 'Sector 14, Old Railway Road',
      city: 'Gurugram',
      state: 'Haryana',
      stateCode: '06',
      pincode: '122001',
      isVerified: true,
      riskScore: 12.0,
      totalInvoicesCount: 5,
      totalAmountBilled: 850000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Chennai Engineering Solutions',
      legalName: 'Chennai Engineering Solutions Private Limited',
      gstin: '33AAACC6789D1Z1',
      pan: 'AAACC6789D',
      email: 'contact@chennaiengg.in',
      phone: '+91 44 2815 3344',
      address: 'Guindy Industrial Estate, Mount Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '600032',
      isVerified: true,
      riskScore: 5.0,
      totalInvoicesCount: 6,
      totalAmountBilled: 1420000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Bengal IT Hardware Distributors',
      legalName: 'Bengal IT Hardware & Solutions LLP',
      gstin: '19AAACB3456L1Z5',
      pan: 'AAACB3456L',
      email: 'billing@bengalithardware.com',
      phone: '+91 33 2282 9900',
      address: 'Sector V, Salt Lake City',
      city: 'Kolkata',
      state: 'West Bengal',
      stateCode: '19',
      pincode: '700091',
      isVerified: true,
      riskScore: 7.5,
      totalInvoicesCount: 5,
      totalAmountBilled: 940000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Apex Industrial Consumables',
      legalName: 'Apex Consumables & Tools LLP',
      gstin: '29AAACA1122R1Z7',
      pan: 'AAACA1122R',
      email: 'apex.tools@outlook.in',
      phone: '+91 80 4123 9876',
      address: 'Peenya Industrial Area, Phase II',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560058',
      isVerified: true,
      riskScore: 28.5,
      totalInvoicesCount: 4,
      totalAmountBilled: 680000.0,
      fraudFlagCount: 1,
    },
    {
      name: 'Skyline Global Imports',
      legalName: 'Skyline Global Trade & Import House',
      gstin: '07AAACS9988E1Z0',
      pan: 'AAACS9988E',
      email: 'trade@skylineglobal.in',
      phone: '+91 11 4567 1122',
      address: 'Nehru Place Commercial Complex',
      city: 'New Delhi',
      state: 'Delhi',
      stateCode: '07',
      pincode: '110019',
      isVerified: false,
      riskScore: 45.0,
      totalInvoicesCount: 2,
      totalAmountBilled: 450000.0,
      fraudFlagCount: 1,
    },
    {
      name: 'QuickServe Supplies & Services',
      legalName: 'QuickServe Facility Management Services',
      gstin: '27AAACQ7788P1Z2',
      pan: 'AAACQ7788P',
      email: 'quickserve.mumbai@yahoo.com',
      phone: '+91 22 2890 1234',
      address: 'Andheri East, MIDC Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400093',
      isVerified: false,
      riskScore: 78.0,
      totalInvoicesCount: 4,
      totalAmountBilled: 890000.0,
      fraudFlagCount: 3,
    },
    {
      name: 'Vardhman Textiles & Uniforms',
      legalName: 'Vardhman Corporate Apparels Ltd',
      gstin: '03AAACV5566T1Z6',
      pan: 'AAACV5566T',
      email: 'corporate@vardhmanapparels.in',
      phone: '+91 161 245 6789',
      address: 'Chandigarh Road, Focal Point',
      city: 'Ludhiana',
      state: 'Punjab',
      stateCode: '03',
      pincode: '141010',
      isVerified: true,
      riskScore: 3.0,
      totalInvoicesCount: 3,
      totalAmountBilled: 520000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Hyderabad Pharma Packaging',
      legalName: 'Hyderabad Precision Packaging Solutions',
      gstin: '36AAACH8899J1Z4',
      pan: 'AAACH8899J',
      email: 'info@hyderabadpackaging.co.in',
      phone: '+91 40 2300 4567',
      address: 'Jeedimetla Industrial Area',
      city: 'Hyderabad',
      state: 'Telangana',
      stateCode: '36',
      pincode: '500055',
      isVerified: true,
      riskScore: 6.5,
      totalInvoicesCount: 4,
      totalAmountBilled: 760000.0,
      fraudFlagCount: 0,
    },
    {
      name: 'Nova Digital Solutions (Shell Co)',
      legalName: 'Nova Digital Cloud Innovations Ltd',
      gstin: '07AAAAA0000A1Z5', // Invalid checksum intentional
      pan: 'AAAAA0000A',
      email: 'contact@novadigitalshell.com',
      phone: '+91 99999 88888',
      address: 'Unknown Basement, Shakarpur',
      city: 'Delhi',
      state: 'Delhi',
      stateCode: '07',
      pincode: '110092',
      isVerified: false,
      riskScore: 92.0,
      totalInvoicesCount: 2,
      totalAmountBilled: 980000.0,
      fraudFlagCount: 2,
    },
    {
      name: 'Godrej Security & Storage Solutions',
      legalName: 'Godrej Security Systems Division',
      gstin: '27AAACG9012N1Z4',
      pan: 'AAACG9012N',
      email: 'commercial@godrejstorage.com',
      phone: '+91 22 6796 5656',
      address: 'Pirojshanagar, Vikhroli',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400079',
      isVerified: true,
      riskScore: 2.0,
      totalInvoicesCount: 5,
      totalAmountBilled: 1650000.0,
      fraudFlagCount: 0,
    },
  ];

  const createdVendors: Record<string, any> = {};
  for (const v of vendorData) {
    const record = await prisma.vendor.create({ data: v });
    createdVendors[v.name] = record;
  }

  console.log('📜 Seeding Purchase Orders...');
  const poData = [
    {
      poNumber: 'PO/2024-25/1001',
      vendorId: createdVendors['Tata Steel Supplies Ltd'].id,
      issueDate: new Date('2024-04-10'),
      totalAmount: 354000.0,
      status: 'FULFILLED',
      notes: 'Quarterly supply of industrial TMT structural steel rods',
      items: [
        { description: 'Fe550D High Grade Structural Steel (Tons)', hsnSac: '7214', quantity: 5, unitPrice: 60000, taxRate: 18.0, totalAmount: 354000.0 },
      ],
    },
    {
      poNumber: 'PO/2024-25/1002',
      vendorId: createdVendors['Infosys Digital Logistics Pvt Ltd'].id,
      issueDate: new Date('2024-05-15'),
      totalAmount: 236000.0,
      status: 'FULFILLED',
      notes: 'Enterprise Cloud ERP Logistics Integration and Maintenance',
      items: [
        { description: 'Cloud Infrastructure & API Support Service', hsnSac: '998313', quantity: 1, unitPrice: 200000, taxRate: 18.0, totalAmount: 236000.0 },
      ],
    },
    {
      poNumber: 'PO/2024-25/1003',
      vendorId: createdVendors['Bharat Heavy Machinery & Spares'].id,
      issueDate: new Date('2024-06-01'),
      totalAmount: 560000.0,
      status: 'FULFILLED',
      notes: 'Hydraulic high-pressure turbine spare parts',
      items: [
        { description: 'Hydraulic Piston Assembly Grade-A', hsnSac: '8413', quantity: 2, unitPrice: 250000, taxRate: 12.0, totalAmount: 560000.0 },
      ],
    },
    {
      poNumber: 'PO/2024-25/1004',
      vendorId: createdVendors['Reliance Polychem Enterprises'].id,
      issueDate: new Date('2024-07-20'),
      totalAmount: 420000.0,
      status: 'FULFILLED',
      notes: 'Industrial Polypropylene Granules (Batch C-99)',
      items: [
        { description: 'High-Density Polymer Granules', hsnSac: '3901', quantity: 10, unitPrice: 35000, taxRate: 20.0, totalAmount: 420000.0 },
      ],
    },
    {
      poNumber: 'PO/2024-25/1005',
      vendorId: createdVendors['Larsen Tech Infrastructures'].id,
      issueDate: new Date('2024-08-12'),
      totalAmount: 295000.0,
      status: 'OPEN',
      notes: 'Plant Electrical cabling and modular grid installation',
      items: [
        { description: 'Industrial Fire-Resistant HT Cabling (500m)', hsnSac: '8544', quantity: 1, unitPrice: 250000, taxRate: 18.0, totalAmount: 295000.0 },
      ],
    },
    {
      poNumber: 'PO/2024-25/1006',
      vendorId: createdVendors['Sharma Electricals & Hardware'].id,
      issueDate: new Date('2024-09-05'),
      totalAmount: 118000.0,
      status: 'OPEN',
      notes: 'Switchgears and Distribution Panel Boxes',
      items: [
        { description: '3-Phase Main Switchgear 440V', hsnSac: '8537', quantity: 2, unitPrice: 50000, taxRate: 18.0, totalAmount: 118000.0 },
      ],
    },
    {
      poNumber: 'PO/2024-25/1007',
      vendorId: createdVendors['Chennai Engineering Solutions'].id,
      issueDate: new Date('2024-10-18'),
      totalAmount: 179200.0,
      status: 'OPEN',
      notes: 'Precision CNC Machined Valve Component Set',
      items: [
        { description: 'Stainless Steel Flanged Valves', hsnSac: '8481', quantity: 8, unitPrice: 20000, taxRate: 12.0, totalAmount: 179200.0 },
      ],
    },
    {
      poNumber: 'PO/2024-25/1008',
      vendorId: createdVendors['Bengal IT Hardware Distributors'].id,
      issueDate: new Date('2024-11-10'),
      totalAmount: 212400.0,
      status: 'OPEN',
      notes: 'Workstation Laptops and Dual-Monitor docking stations',
      items: [
        { description: 'Core i7 Enterprise Laptops', hsnSac: '8471', quantity: 3, unitPrice: 60000, taxRate: 18.0, totalAmount: 212400.0 },
      ],
    },
    {
      poNumber: 'PO/2024-25/1009',
      vendorId: createdVendors['Godrej Security & Storage Solutions'].id,
      issueDate: new Date('2024-12-02'),
      totalAmount: 389400.0,
      status: 'OPEN',
      notes: 'Heavy Duty Heavy Racking System for Central Warehouse',
      items: [
        { description: 'Modular Warehouse Storage Racks', hsnSac: '9403', quantity: 6, unitPrice: 55000, taxRate: 18.0, totalAmount: 389400.0 },
      ],
    },
  ];

  const createdPOs: Record<string, any> = {};
  for (const po of poData) {
    const { items, ...poFields } = po;
    const poRecord = await prisma.purchaseOrder.create({
      data: {
        ...poFields,
        items: {
          create: items,
        },
      },
    });
    createdPOs[po.poNumber] = poRecord;
  }

  console.log('🧾 Seeding Realistic Invoices across Risk Categories...');

  // Helper to generate Invoice & Detection & Rules
  async function seedInvoice(params: {
    invoiceNumber: string;
    vendorName: string;
    poNumber?: string;
    invoiceDate: Date;
    dueDate?: Date;
    taxableAmount: number;
    gstRate: number; // 0, 5, 12, 18, 28
    isInterState: boolean;
    status: string;
    fraudScore: number;
    riskLevel: string;
    itemDesc: string;
    hsnSac: string;
    qty: number;
    unitPrice: number;
    // Overrides for fraud testing
    overrideVendorGstin?: string;
    overrideCgst?: number;
    overrideSgst?: number;
    overrideIgst?: number;
    overrideGrandTotal?: number;
    rulesTriggered: TriggeredRule[];
    alert?: {
      type: string;
      severity: string;
      title: string;
      description: string;
    };
  }) {
    const vendor = createdVendors[params.vendorName];
    const po = params.poNumber ? createdPOs[params.poNumber] : null;

    const totalTax = (params.taxableAmount * params.gstRate) / 100;
    const isInter = params.isInterState;
    const normalCgst = isInter ? 0 : totalTax / 2;
    const normalSgst = isInter ? 0 : totalTax / 2;
    const normalIgst = isInter ? totalTax : 0;
    const normalGrandTotal = params.taxableAmount + totalTax;

    const cgstAmount = params.overrideCgst !== undefined ? params.overrideCgst : normalCgst;
    const sgstAmount = params.overrideSgst !== undefined ? params.overrideSgst : normalSgst;
    const igstAmount = params.overrideIgst !== undefined ? params.overrideIgst : normalIgst;
    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
    const grandTotal = params.overrideGrandTotal !== undefined ? params.overrideGrandTotal : (params.taxableAmount + totalTaxAmount);

    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: params.invoiceNumber,
        vendorId: vendor.id,
        purchaseOrderId: po ? po.id : null,
        invoiceDate: params.invoiceDate,
        dueDate: params.dueDate || new Date(params.invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        vendorGstin: params.overrideVendorGstin || vendor.gstin,
        customerGstin: OUR_COMPANY_GSTIN,
        placeOfSupply: isInter ? vendor.state : 'Maharashtra',
        placeOfSupplyStateCode: isInter ? vendor.stateCode : '27',
        billingAddress: 'FraudShield HQ, Level 7, Nariman Point, Mumbai - 400021',
        taxableAmount: params.taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalTaxAmount,
        grandTotal,
        roundOff: 0.0,
        isInterState: isInter,
        status: params.status,
        fraudScore: params.fraudScore,
        riskLevel: params.riskLevel,
        fileName: `${params.invoiceNumber.replace(/\//g, '_')}.pdf`,
        fileType: 'application/pdf',
        items: {
          create: [
            {
              itemDescription: params.itemDesc,
              hsnSac: params.hsnSac,
              quantity: params.qty,
              unitPrice: params.unitPrice,
              taxableValue: params.taxableAmount,
              gstRate: params.gstRate,
              cgstAmount,
              sgstAmount,
              igstAmount,
              totalAmount: grandTotal,
            },
          ],
        },
      },
    });

    // Create Fraud Detection & Rules
    const passedCount = params.rulesTriggered.filter(r => r.status === 'PASS').length;
    const warningCount = params.rulesTriggered.filter(r => r.status === 'WARNING').length;
    const failedCount = params.rulesTriggered.filter(r => r.status === 'FAIL').length;
    const criticalCount = params.rulesTriggered.filter(r => r.status === 'CRITICAL').length;

    await prisma.fraudDetection.create({
      data: {
        invoiceId: inv.id,
        overallScore: params.fraudScore,
        riskLevel: params.riskLevel,
        passedRulesCount: passedCount,
        warningRulesCount: warningCount,
        failedRulesCount: failedCount,
        criticalRulesCount: criticalCount,
        summaryExplanation:
          params.fraudScore === 0
            ? 'All Indian GST & transaction integrity validations passed cleanly.'
            : `Evaluated ${params.rulesTriggered.length} rules. Risk score penalty: ${params.fraudScore}/100. Classification: ${params.riskLevel}`,
        ruleResults: {
          create: params.rulesTriggered.map(r => ({
            ruleCode: r.code,
            ruleCategory: r.category,
            ruleName: r.name,
            status: r.status,
            scoreContribution: r.score,
            details: r.details,
            detectedValue: r.detected || null,
            expectedValue: r.expected || null,
          })),
        },
      },
    });

    if (params.alert) {
      await prisma.fraudAlert.create({
        data: {
          invoiceId: inv.id,
          alertType: params.alert.type,
          severity: params.alert.severity,
          title: params.alert.title,
          description: params.alert.description,
          status: params.riskLevel === 'CRITICAL' ? 'OPEN' : 'IN_REVIEW',
          assignedToId: auditor.id,
        },
      });
    }

    // Add Audit Log
    await prisma.auditLog.create({
      data: {
        userId: financeUser.id,
        invoiceId: inv.id,
        action: 'INVOICE_PROCESSED',
        entityType: 'INVOICE',
        entityId: inv.id,
        details: `Invoice ${inv.invoiceNumber} from ${params.vendorName} processed. Score: ${params.fraudScore} (${params.riskLevel})`,
      },
    });

    return inv;
  }

  // ==========================================
  // 1. CLEAN LEGITIMATE INVOICES (LOW RISK: 0 - 10 pts) - 35 Invoices
  // ==========================================
  const cleanVendors = [
    { name: 'Tata Steel Supplies Ltd', code: 'TSL', isInter: false, rate: 18, hsn: '7214', desc: 'Structural TMT Reinforcement Rods' },
    { name: 'Infosys Digital Logistics Pvt Ltd', code: 'INF', isInter: true, rate: 18, hsn: '998313', desc: 'Cloud ERP Software Maintenance' },
    { name: 'Bharat Heavy Machinery & Spares', code: 'BHM', isInter: true, rate: 12, hsn: '8413', desc: 'Hydraulic Piston Assemblies' },
    { name: 'Reliance Polychem Enterprises', code: 'RPE', isInter: true, rate: 18, hsn: '3901', desc: 'Polymer Injection Granules' },
    { name: 'Larsen Tech Infrastructures', code: 'LTI', isInter: false, rate: 18, hsn: '8544', desc: 'Fire-Resistant Armored Cabling' },
    { name: 'Chennai Engineering Solutions', code: 'CES', isInter: true, rate: 12, hsn: '8481', desc: 'Industrial Stainless Steel Valves' },
    { name: 'Godrej Security & Storage Solutions', code: 'GSS', isInter: false, rate: 18, hsn: '9403', desc: 'Heavy Duty Storage Racks' },
  ];

  let cleanInvSeq = 100;
  for (let m = 4; m <= 12; m++) {
    for (let idx = 0; idx < cleanVendors.length; idx++) {
      const v = cleanVendors[idx];
      cleanInvSeq++;
      const taxable = 80000 + (idx * 35000) + ((m - 4) * 8000);
      const invDate = new Date(2024, m - 1, 5 + (idx * 3));

      const cleanRules: TriggeredRule[] = [
        { code: 'DUP-01', category: 'DUPLICATE', name: 'Exact Duplicate Invoice Check', status: 'PASS', score: 0, details: 'Invoice number is unique in vendor database.' },
        { code: 'GST-01', category: 'GST_VALIDATION', name: 'GSTIN Format & State Check', status: 'PASS', score: 0, details: 'Valid Indian GSTIN format and state code.' },
        { code: 'GST-02', category: 'GST_VALIDATION', name: 'GSTIN-PAN Consistency', status: 'PASS', score: 0, details: 'PAN substring matches vendor master record.' },
        { code: 'TAX-01', category: 'TAX_VALIDATION', name: 'Tax Type Applicability', status: 'PASS', score: 0, details: v.isInter ? 'Inter-state IGST correctly applied.' : 'Intra-state CGST + SGST correctly applied.' },
        { code: 'TAX-02', category: 'TAX_VALIDATION', name: 'Tax Math Verification', status: 'PASS', score: 0, details: 'Computed tax matches rate within ₹0.01 tolerance.' },
        { code: 'ANO-01', category: 'AMOUNT_ANOMALY', name: 'Vendor Historical Average', status: 'PASS', score: 0, details: 'Invoice amount is within normal historical distribution.' },
      ];

      await seedInvoice({
        invoiceNumber: `INV/${v.code}/2024/${cleanInvSeq}`,
        vendorName: v.name,
        invoiceDate: invDate,
        taxableAmount: taxable,
        gstRate: v.rate,
        isInterState: v.isInter,
        status: 'VERIFIED',
        fraudScore: 0,
        riskLevel: 'LOW',
        itemDesc: v.desc,
        hsnSac: v.hsn,
        qty: 10,
        unitPrice: taxable / 10,
        rulesTriggered: cleanRules,
      });
    }
  }

  // ==========================================
  // 2. MEDIUM RISK INVOICES (25 - 45 pts) - 5 Invoices
  // (e.g. Unverified New Vendor, Stale review lag, Missing HSN, Round number)
  // ==========================================
  const mediumCases: MediumCase[] = [
    {
      invNum: 'INV/SKY/2024/201',
      vendor: 'Skyline Global Imports',
      date: new Date('2024-10-15'),
      taxable: 220000,
      rate: 18,
      isInter: true,
      desc: 'Imported Laboratory Optical Lenses',
      hsn: '9001',
      score: 30,
      rules: [
        { code: 'VEN-01', category: 'VENDOR_RISK', name: 'Unverified New Vendor', status: 'WARNING', score: 15, details: 'First high-value invoice from unverified new vendor.' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 15, details: 'Invoice > ₹50,000 without linked approved Purchase Order.' },
      ],
    },
    {
      invNum: 'INV/VTM/2024/405',
      vendor: 'Vardhman Textiles & Uniforms',
      date: new Date('2024-05-10'), // Stale date > 180 days review
      taxable: 150000,
      rate: 5,
      isInter: true,
      desc: 'Plant Protective Uniform Coveralls',
      hsn: '', // Missing HSN
      score: 25,
      rules: [
        { code: 'MAN-01', category: 'MANIPULATION', name: 'Missing Mandatory HSN/SAC', status: 'WARNING', score: 10, details: 'Line items omit mandatory Indian HSN code.' },
        { code: 'DAT-02', category: 'DATE_ANOMALY', name: 'Stale Invoice Submission', status: 'WARNING', score: 5, details: 'Invoice submitted > 180 days after claimed date for audit review.' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 10, details: 'Invoice missing PO linkage.' },
      ],
    },
    {
      invNum: 'INV/APX/2024/881',
      vendor: 'Apex Industrial Consumables',
      date: new Date('2024-11-20'),
      taxable: 100000,
      rate: 0,
      isInter: true,
      desc: 'Unclassified Maintenance Hardware Batch',
      hsn: '8207',
      score: 35,
      rules: [
        { code: 'ANO-02', category: 'AMOUNT_ANOMALY', name: 'Suspicious Round Amount', status: 'WARNING', score: 10, details: 'Round sum ₹1,00,000.00 with zero GST charged.' },
        { code: 'VEN-01', category: 'VENDOR_RISK', name: 'Vendor Historical Risk', status: 'WARNING', score: 15, details: 'Vendor has prior dispute flags.' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 10, details: 'Invoice missing PO linkage.' },
      ],
    },
    {
      invNum: 'INV/HYD/2024/310',
      vendor: 'Hyderabad Pharma Packaging',
      date: new Date('2024-12-05'),
      taxable: 180000,
      rate: 18,
      isInter: true,
      desc: 'Aluminium Foil Strip Packaging',
      hsn: '7607',
      score: 30,
      rules: [
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked Purchase Order', status: 'WARNING', score: 15, details: 'Invoice value > ₹50,000 without mandatory Purchase Order.' },
        { code: 'ANO-01', category: 'AMOUNT_ANOMALY', name: 'Amount Above Average', status: 'WARNING', score: 15, details: 'Invoice value is 2.4x higher than standard order profile.' },
      ],
    },
    {
      invNum: 'INV/SEH/2024/112',
      vendor: 'Sharma Electricals & Hardware',
      date: new Date('2024-10-28'),
      taxable: 140000,
      rate: 18,
      isInter: true,
      desc: 'Copper Earthing Strips and Rods',
      hsn: '7407',
      score: 25,
      rules: [
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked Purchase Order', status: 'WARNING', score: 15, details: 'No PO linked for this transaction.' },
        { code: 'DAT-02', category: 'DATE_ANOMALY', name: 'Delayed Invoice Submission', status: 'WARNING', score: 10, details: 'Invoice date lagged by > 90 days.' },
      ],
    },
  ];

  for (let i = 0; i < mediumCases.length; i++) {
    const c = mediumCases[i];
    await seedInvoice({
      invoiceNumber: c.invNum,
      vendorName: c.vendor,
      invoiceDate: c.date,
      taxableAmount: c.taxable,
      gstRate: c.rate,
      isInterState: c.isInter,
      status: 'SUSPICIOUS',
      fraudScore: c.score,
      riskLevel: 'MEDIUM',
      itemDesc: c.desc,
      hsnSac: c.hsn,
      qty: 1,
      unitPrice: c.taxable,
      rulesTriggered: c.rules,
    });
  }

  // ==========================================
  // 3. HIGH RISK INVOICES (50 - 74 pts) - 4 Invoices
  // (e.g. CGST != SGST mismatch, PO Amount Exceeded, Vendor Historical Spike > 3.5x, GSTIN-PAN Mismatch)
  // ==========================================
  const highCases: HighCase[] = [
    {
      invNum: 'INV/TSL/2024/9901',
      vendor: 'Tata Steel Supplies Ltd',
      date: new Date('2024-09-18'),
      taxable: 200000,
      rate: 18,
      isInter: false,
      desc: 'High Tensile Structural Angles (Manipulated Tax)',
      hsn: '7216',
      overrideCgst: 24000, // CGST 12% instead of 9%
      overrideSgst: 18000, // SGST 9% -> Mismatch
      score: 55,
      rules: [
        { code: 'TAX-03', category: 'TAX_VALIDATION', name: 'CGST != SGST Discrepancy', status: 'FAIL', score: 20, details: 'CGST (₹24,000) does not match SGST (₹18,000) for intra-state supply.', detected: 'CGST: ₹24,000, SGST: ₹18,000', expected: 'CGST: ₹18,000, SGST: ₹18,000' },
        { code: 'TAX-02', category: 'TAX_VALIDATION', name: 'Tax Rate Math Discrepancy', status: 'FAIL', score: 20, details: 'Total tax charged (₹42,000) exceeds 18% slab (₹36,000).', detected: '₹42,000', expected: '₹36,000' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 15, details: 'Missing PO reference.' },
      ],
      alert: {
        type: 'TAX_CALCULATION_MISMATCH',
        severity: 'HIGH',
        title: 'Intra-state CGST/SGST Asymmetry Detected',
        description: 'Invoice INV/TSL/2024/9901 contains asymmetric CGST (₹24k) vs SGST (₹18k). Requires audit correction.',
      },
    },
    {
      invNum: 'INV/RPE/2024/8844',
      vendor: 'Reliance Polychem Enterprises',
      date: new Date('2024-11-04'),
      taxable: 1400000, // Massive spike > 3.5x normal
      rate: 18,
      isInter: true,
      desc: 'Bulk Specialized Chemical Catalyst Solvents',
      hsn: '2905',
      score: 65,
      rules: [
        { code: 'ANO-01', category: 'AMOUNT_ANOMALY', name: 'Vendor Historical Spike', status: 'FAIL', score: 25, details: 'Invoice value ₹16,52,000 is 4.4x higher than vendor 12-month average (₹3,75,000).', detected: '₹16,52,000', expected: 'Avg: ₹3,75,000' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 15, details: 'Invoice > ₹10 Lakhs without PO pre-approval.' },
        { code: 'MAN-02', category: 'MANIPULATION', name: 'Missing Delivery Acknowledgment', status: 'FAIL', score: 25, details: 'No physical gate-entry record attached.' },
      ],
      alert: {
        type: 'ANOMALOUS_TRANSACTION_SPIKE',
        severity: 'HIGH',
        title: 'Abnormal Transaction Spike (4.4x Historical Mean)',
        description: 'Sudden high-value billing without PO approval. Flagged for forensic AP audit.',
      },
    },
    {
      invNum: 'INV/BHM/2024/6712',
      vendor: 'Bharat Heavy Machinery & Spares',
      poNumber: 'PO/2024-25/1003',
      date: new Date('2024-08-25'),
      taxable: 750000, // Authorized PO was only 500,000
      rate: 12,
      isInter: true,
      desc: 'Hydraulic Piston Assemblies Extra Billing',
      hsn: '8413',
      score: 55,
      rules: [
        { code: 'PO-02', category: 'PO_MATCHING', name: 'PO Authorized Limit Exceeded', status: 'FAIL', score: 25, details: 'Billed amount (₹8,40,000) exceeds authorized PO limit (₹5,60,000) by +50%.', detected: '₹8,40,000', expected: 'PO: ₹5,60,000' },
        { code: 'TAX-01', category: 'TAX_VALIDATION', name: 'Applicable Tax Check', status: 'PASS', score: 0, details: 'Tax rates conform to 12% HSN 8413.' },
        { code: 'ANO-01', category: 'AMOUNT_ANOMALY', name: 'Order Value Deviation', status: 'FAIL', score: 20, details: 'Variance deviates significantly from purchase contract.' },
        { code: 'MAN-01', category: 'MANIPULATION', name: 'Unapproved Price Revision', status: 'WARNING', score: 10, details: 'Unit rate inflated from ₹2,50,000 to ₹3,75,000 without amendment.' },
      ],
      alert: {
        type: 'PO_OVERRUN_VIOLATION',
        severity: 'HIGH',
        title: 'PO Authorized Threshold Exceeded by 50%',
        description: 'Invoice exceeds agreed purchase order commitment without signed contract addendum.',
      },
    },
    {
      invNum: 'INV/QSV/2024/7701',
      vendor: 'QuickServe Supplies & Services',
      date: new Date('2024-11-12'),
      taxable: 350000,
      rate: 18,
      isInter: false,
      desc: 'Facility Sanitization & Deep Cleaning Service',
      hsn: '998714',
      overrideVendorGstin: '27AAACQ7788P1ZZ', // Changed checksum
      score: 65,
      rules: [
        { code: 'VEN-02', category: 'VENDOR_RISK', name: 'High Historical Fraud Rate', status: 'FAIL', score: 25, details: 'Vendor has 3 confirmed audit irregularities in past 6 months.' },
        { code: 'GST-03', category: 'GST_VALIDATION', name: 'Vendor Master GSTIN Mismatch', status: 'FAIL', score: 20, details: 'Invoice GSTIN (27AAACQ7788P1ZZ) does not match registered GSTIN (27AAACQ7788P1Z2).', detected: '27AAACQ7788P1ZZ', expected: '27AAACQ7788P1Z2' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 15, details: 'Missing PO linkage.' },
      ],
      alert: {
        type: 'RISKY_VENDOR_GSTIN_MISMATCH',
        severity: 'HIGH',
        title: 'Altered GSTIN from High-Risk Vendor',
        description: 'QuickServe Supplies issued an invoice with an altered GSTIN check digit.',
      },
    },
  ];

  for (let i = 0; i < highCases.length; i++) {
    const c = highCases[i];
    await seedInvoice({
      invoiceNumber: c.invNum,
      vendorName: c.vendor,
      poNumber: c.poNumber,
      invoiceDate: c.date,
      taxableAmount: c.taxable,
      gstRate: c.rate,
      isInterState: c.isInter,
      status: 'SUSPICIOUS',
      fraudScore: c.score,
      riskLevel: 'HIGH',
      itemDesc: c.desc,
      hsnSac: c.hsn,
      qty: 1,
      unitPrice: c.taxable,
      overrideCgst: c.overrideCgst,
      overrideSgst: c.overrideSgst,
      overrideVendorGstin: c.overrideVendorGstin,
      rulesTriggered: c.rules,
      alert: c.alert,
    });
  }

  // ==========================================
  // 4. CRITICAL RISK INVOICES (75 - 100 pts) - 4 Invoices
  // (e.g. Exact Duplicate Invoice, Cloned Amount Fraud, Fake GSTIN Checksum, Future Dating, Line-item Math Manipulation)
  // ==========================================
  const criticalCases: CriticalCase[] = [
    {
      invNum: 'INV/TSL/2024/101-DUP',
      vendor: 'Tata Steel Supplies Ltd',
      date: new Date('2024-04-12'),
      taxable: 80000,
      rate: 18,
      isInter: false,
      desc: 'Structural TMT Reinforcement Rods (Duplicate Claim)',
      hsn: '7214',
      score: 85,
      rules: [
        { code: 'DUP-01', category: 'DUPLICATE', name: 'Exact Duplicate Invoice Detected', status: 'CRITICAL', score: 35, details: 'Invoice number INV/TSL/2024/101 already exists and was settled on 2024-04-05.', detected: 'INV/TSL/2024/101 (Exists)', expected: 'Unique Invoice Number' },
        { code: 'DUP-02', category: 'DUPLICATE', name: 'Suspicious Amount Clone', status: 'FAIL', score: 25, details: 'Identical amount ₹94,400 submitted within 7-day window.', detected: '₹94,400', expected: 'Distinct Transaction Value' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 15, details: 'Missing PO reference.' },
        { code: 'MAN-02', category: 'MANIPULATION', name: 'Altered Submission Channel', status: 'WARNING', score: 10, details: 'Submitted via unverified web portal.' },
      ],
      alert: {
        type: 'EXACT_DUPLICATE_SUBMISSION',
        severity: 'CRITICAL',
        title: 'CRITICAL: Exact Duplicate Invoice Resubmission',
        description: 'Invoice INV/TSL/2024/101 was already verified and approved. Attempted double-billing detected.',
      },
    },
    {
      invNum: 'INV/SHL/2024/9001',
      vendor: 'Nova Digital Solutions (Shell Co)',
      date: new Date('2024-11-28'),
      taxable: 450000,
      rate: 18,
      isInter: true,
      desc: 'Fictitious Cloud Security License Consultation',
      hsn: '998311',
      overrideVendorGstin: '07AAAAA0000A1Z5', // Fake GSTIN
      score: 95,
      rules: [
        { code: 'GST-01', category: 'GST_VALIDATION', name: 'Invalid Fake GSTIN Checksum', status: 'CRITICAL', score: 30, details: 'GSTIN 07AAAAA0000A1Z5 fails Indian GST checksum algorithm.', detected: '07AAAAA0000A1Z5', expected: 'Valid Govt GSTIN' },
        { code: 'GST-02', category: 'GST_VALIDATION', name: 'Fake PAN Identifier', status: 'FAIL', score: 25, details: 'PAN AAAAA0000A is not registered in CBDT PAN database.', detected: 'AAAAA0000A', expected: 'Valid Taxpayer PAN' },
        { code: 'VEN-02', category: 'VENDOR_RISK', name: 'High Risk Flagged Vendor', status: 'FAIL', score: 25, details: 'Vendor flagged on circular-trading watchlists.', detected: 'Shell Entity', expected: 'Verified Supplier' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 15, details: 'No PO linked.' },
      ],
      alert: {
        type: 'FAKE_GSTIN_SHELL_ENTITY',
        severity: 'CRITICAL',
        title: 'CRITICAL: Fictitious Shell Vendor & Fake GSTIN',
        description: 'GSTIN checksum failure and unverified entity attempting to bill ₹5,31,000 for fictitious consulting.',
      },
    },
    {
      invNum: 'INV/INF/2025/FUTURE-99',
      vendor: 'Infosys Digital Logistics Pvt Ltd',
      date: new Date('2026-12-31'), // Far future date
      taxable: 350000,
      rate: 18,
      isInter: true,
      desc: 'Advance Maintenance Contract (Future Dated)',
      hsn: '998313',
      score: 75,
      rules: [
        { code: 'DAT-01', category: 'DATE_ANOMALY', name: 'Future Invoice Date', status: 'CRITICAL', score: 30, details: 'Invoice date 31/12/2026 is in the future (> current system date).', detected: '31/12/2026', expected: '<= Current Date' },
        { code: 'PO-02', category: 'PO_MATCHING', name: 'PO Mismatch', status: 'FAIL', score: 25, details: 'Billed without matching active fiscal PO.', detected: 'No PO', expected: 'Valid PO' },
        { code: 'MAN-02', category: 'MANIPULATION', name: 'Suspicious Date Manipulation', status: 'FAIL', score: 20, details: 'Future dated billing used to bypass fiscal closing controls.' },
      ],
      alert: {
        type: 'FUTURE_DATED_INVOICE',
        severity: 'CRITICAL',
        title: 'CRITICAL: Future Dated Invoice Submission',
        description: 'Invoice dated 31/12/2026. Cannot accept post-dated financial liabilities.',
      },
    },
    {
      invNum: 'INV/QSV/2024/CLONE-88',
      vendor: 'QuickServe Supplies & Services',
      date: new Date('2024-11-14'),
      taxable: 413000, // Total = 487340
      rate: 18,
      isInter: false,
      desc: 'Janitorial & Sanitization Bulk Consumables',
      hsn: '3402',
      overrideGrandTotal: 580000, // Manipulated total (+₹92,660 added!)
      score: 90,
      rules: [
        { code: 'TAX-04', category: 'TAX_VALIDATION', name: 'Line Item Math Manipulation', status: 'CRITICAL', score: 30, details: 'Line items sum to ₹4,87,340, but invoice header bills ₹5,80,000 (discrepancy ₹92,660).', detected: '₹5,80,000', expected: '₹4,87,340' },
        { code: 'VEN-02', category: 'VENDOR_RISK', name: 'Repeat Fraud Offender', status: 'FAIL', score: 25, details: 'Vendor has multiple unresolved fraud alerts.', detected: 'Repeat Flag', expected: 'Clean Vendor' },
        { code: 'PO-01', category: 'PO_MATCHING', name: 'Unlinked High Value PO', status: 'WARNING', score: 15, details: 'No PO linked.' },
        { code: 'TAX-02', category: 'TAX_VALIDATION', name: 'Tax Math Mismatch', status: 'FAIL', score: 20, details: 'GST slab percentages manipulated on summary sheet.' },
      ],
      alert: {
        type: 'HEADER_LINEITEM_MISMATCH',
        severity: 'CRITICAL',
        title: 'CRITICAL: Line-Item Math Manipulation (+₹92,660)',
        description: 'Grand total on invoice header does not match calculated sum of individual line items.',
      },
    },
  ];

  for (let i = 0; i < criticalCases.length; i++) {
    const c = criticalCases[i];
    await seedInvoice({
      invoiceNumber: c.invNum,
      vendorName: c.vendor,
      invoiceDate: c.date,
      taxableAmount: c.taxable,
      gstRate: c.rate,
      isInterState: c.isInter,
      status: 'FLAGGED_FRAUD',
      fraudScore: c.score,
      riskLevel: 'CRITICAL',
      itemDesc: c.desc,
      hsnSac: c.hsn,
      qty: 1,
      unitPrice: c.taxable,
      overrideGrandTotal: c.overrideGrandTotal,
      overrideVendorGstin: c.overrideVendorGstin,
      rulesTriggered: c.rules,
      alert: c.alert,
    });
  }

  console.log('⚙️ Seeding System Settings...');
  const settings = [
    { key: 'RULE_DUP_01_WEIGHT', value: '35', description: 'Exact Duplicate Invoice penalty weight', category: 'FRAUD_RULES' },
    { key: 'RULE_GST_01_WEIGHT', value: '30', description: 'Invalid GSTIN Format / Checksum penalty weight', category: 'FRAUD_RULES' },
    { key: 'RULE_TAX_01_WEIGHT', value: '20', description: 'Tax Type Applicability Mismatch penalty weight', category: 'FRAUD_RULES' },
    { key: 'RULE_ANO_01_WEIGHT', value: '20', description: 'Vendor Historical Average Spike penalty weight', category: 'FRAUD_RULES' },
    { key: 'RULE_PO_02_WEIGHT', value: '25', description: 'PO Authorized Limit Exceeded penalty weight', category: 'FRAUD_RULES' },
    { key: 'RISK_THRESHOLD_LOW', value: '24', description: 'Maximum score for Low Risk (0-24)', category: 'THRESHOLDS' },
    { key: 'RISK_THRESHOLD_MEDIUM', value: '49', description: 'Maximum score for Medium Risk (25-49)', category: 'THRESHOLDS' },
    { key: 'RISK_THRESHOLD_HIGH', value: '74', description: 'Maximum score for High Risk (50-74)', category: 'THRESHOLDS' },
    { key: 'OUR_COMPANY_GSTIN', value: OUR_COMPANY_GSTIN, description: 'Our Corporate GSTIN', category: 'GENERAL' },
    { key: 'AUTO_FLAG_CRITICAL_ALERTS', value: 'true', description: 'Automatically generate forensic alerts for score >= 75', category: 'GENERAL' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }

  console.log('✅ Indian Seed Data successfully generated!');
  console.log(`📊 Summary:
  - Users: 3 (Admin, Auditor, Finance User)
  - Vendors: 15 Indian Vendors (Maharashtra, Karnataka, Delhi, Gujarat, etc.)
  - Purchase Orders: 9 Realistic POs
  - Invoices: ~75 Invoices across Low, Medium, High & Critical risk
  - Detection Results, Rule Breakdowns & Alerts: Populated`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
