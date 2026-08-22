process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../index';
import prisma from '../utils/prisma';
import fs from 'fs';
import path from 'path';

async function runPhase4Verification() {
  console.log('================================================================');
  console.log('🚀 PHASE 4: INVOICE UPLOAD & MANAGEMENT VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function verify(testName: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? `-> ${details}` : ''}`);
    }
  }

  // 1. Start Server for live testing
  const server = http.createServer(app);
  const TEST_PORT = 5098;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  try {
    // ----------------------------------------------------------------
    // 1. Auth Setup
    // ----------------------------------------------------------------
    console.log('--- 1. Authentication Setup ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fraudshield.in', password: 'Admin@123' }),
    });
    const loginData: any = await loginRes.json();
    const token = loginData.data?.token;
    verify('Admin authentication succeeds', Boolean(token));

    const vendor = await prisma.vendor.findFirst();
    verify('Found vendor master record for testing', Boolean(vendor?.id), `Vendor: ${vendor?.name}`);

    // ----------------------------------------------------------------
    // 2. Test WAY 1: Manual Invoice Entry Workflow
    // ----------------------------------------------------------------
    console.log('\n--- 2. Manual Invoice Creation & Fraud Engine Test ---');
    const manualInvoicePayload = {
      invoiceNumber: `INV-MANUAL-${Date.now()}`,
      vendorId: vendor?.id,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      vendorGstin: vendor?.gstin,
      customerGstin: '27AAACG1234F1Z5',
      placeOfSupply: vendor?.state || 'Maharashtra',
      placeOfSupplyStateCode: vendor?.stateCode || '27',
      billingAddress: 'Level 8, Nariman Point, Mumbai - 400021',
      taxableAmount: 50000,
      cgstAmount: 4500,
      sgstAmount: 4500,
      igstAmount: 0,
      grandTotal: 59000,
      isInterState: false,
      items: [
        {
          itemDescription: 'High Precision CNC Milling Cutters',
          hsnSac: '8207',
          quantity: 5,
          unitPrice: 10000,
          taxableValue: 50000,
          gstRate: 18,
          cgstAmount: 4500,
          sgstAmount: 4500,
          igstAmount: 0,
          totalAmount: 59000,
        },
      ],
    };

    const manualRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(manualInvoicePayload),
    });
    const manualData: any = await manualRes.json();
    const createdManualInv = manualData.data;

    verify('Manual invoice creation API succeeds (201 Created)', manualRes.status === 201);
    verify('Manual invoice evaluated by fraud engine', Boolean(createdManualInv?.detection));
    verify('Manual invoice has 20 itemized rule outputs', createdManualInv?.detection?.ruleResults?.length === 20, `${createdManualInv?.detection?.ruleResults?.length} rules evaluated`);
    verify('Manual invoice risk score is valid number (0-100)', typeof createdManualInv?.fraudScore === 'number' && createdManualInv?.fraudScore >= 0 && createdManualInv?.fraudScore <= 100, `Score: ${createdManualInv?.fraudScore}`);

    // ----------------------------------------------------------------
    // 3. Test WAY 2: Document Upload & Extraction Workflow
    // ----------------------------------------------------------------
    console.log('\n--- 3. Document Extraction & OCR Pipeline Test ---');
    // Create a temporary sample dummy PDF file for testing
    const sampleFilePath = path.join(process.cwd(), 'sample_test_invoice.pdf');
    fs.writeFileSync(sampleFilePath, '%PDF-1.4 simulated test invoice content for OCR test');

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileContent = fs.readFileSync(sampleFilePath);

    // Build multipart body manually
    const multipartBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample_test_invoice.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
      ),
      fileContent,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="vendorId"\r\n\r\n${vendor?.id}\r\n--${boundary}--\r\n`),
    ]);

    // Test POST /api/invoices/extract
    const extractRes = await fetch(`${baseUrl}/invoices/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${token}`,
      },
      body: multipartBody,
    });
    const extractData: any = await extractRes.json();
    verify('POST /api/invoices/extract succeeds (200 OK)', extractRes.status === 200);
    verify('Extraction returns parsed fields & line items', Boolean(extractData.data?.extracted?.invoiceNumber && extractData.data?.extracted?.items?.length > 0));
    verify('Extraction associates matched vendor record', Boolean(extractData.data?.matchedVendor?.id));

    // Test POST /api/invoices/upload (direct upload pipeline)
    const uploadRes = await fetch(`${baseUrl}/invoices/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${token}`,
      },
      body: multipartBody,
    });
    const uploadData: any = await uploadRes.json();
    verify('POST /api/invoices/upload succeeds (201 Created)', uploadRes.status === 201);
    verify('Uploaded invoice evaluated through 20 deterministic rules', uploadData.data?.invoice?.detection?.ruleResults?.length === 20);

    // Clean up temporary sample file
    if (fs.existsSync(sampleFilePath)) {
      fs.unlinkSync(sampleFilePath);
    }

    // ----------------------------------------------------------------
    // 4. Test Forensic Actions Workflow
    // ----------------------------------------------------------------
    console.log('\n--- 4. Forensic Actions (Approve, Reject, Flag Fraud, Review, Re-evaluate) ---');
    const targetId = createdManualInv.id;

    // Action 1: Send for Review (SUSPICIOUS)
    const reviewRes = await fetch(`${baseUrl}/invoices/${targetId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'SUSPICIOUS', reviewNotes: 'Flagged for line-item rate cross-audit.' }),
    });
    const reviewData: any = await reviewRes.json();
    verify('Action: Send for Review (SUSPICIOUS)', reviewData.data?.status === 'SUSPICIOUS');

    // Action 2: Mark as Fraud (FLAGGED_FRAUD)
    const fraudRes = await fetch(`${baseUrl}/invoices/${targetId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'FLAGGED_FRAUD', reviewNotes: 'Confirmed fake invoice.' }),
    });
    const fraudData: any = await fraudRes.json();
    verify('Action: Mark as Fraud (FLAGGED_FRAUD)', fraudData.data?.status === 'FLAGGED_FRAUD');

    // Action 3: Reject (REJECTED)
    const rejectRes = await fetch(`${baseUrl}/invoices/${targetId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'REJECTED', reviewNotes: 'Rejected by AP manager.' }),
    });
    const rejectData: any = await rejectRes.json();
    verify('Action: Reject Invoice (REJECTED)', rejectData.data?.status === 'REJECTED');

    // Action 4: Approve & Verify (VERIFIED)
    const approveRes = await fetch(`${baseUrl}/invoices/${targetId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'VERIFIED', reviewNotes: 'All validations cleared.' }),
    });
    const approveData: any = await approveRes.json();
    verify('Action: Approve & Verify (VERIFIED)', approveData.data?.status === 'VERIFIED');

    // Action 5: Re-evaluate
    const reEvalRes = await fetch(`${baseUrl}/invoices/${targetId}/re-evaluate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const reEvalData: any = await reEvalRes.json();
    verify('Action: Re-evaluate Fraud Score', reEvalData.success === true && typeof reEvalData.data?.fraudScore === 'number');

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`📊 PHASE 4 VERIFICATION RESULTS: ${passed} / ${total} CHECKS PASSED`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase4Verification().catch((err) => {
  console.error('Phase 4 verification error:', err);
  process.exit(1);
});
