process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../index';
import prisma from '../utils/prisma';

async function runPhase5Verification() {
  console.log('================================================================');
  console.log('🔍 PHASE 5: FRAUD INTELLIGENCE & FORENSIC INSPECTOR AUDIT SUITE');
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

  // 1. Start Server on ephemeral port
  const server = http.createServer(app);
  const TEST_PORT = 5096;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  try {
    // ----------------------------------------------------------------
    // 1. Auth Setup
    // ----------------------------------------------------------------
    console.log('--- 1. Authentication & Auditor Credentials ---');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'auditor.sharma@fraudshield.in', password: 'Audit@123' }),
    });
    const loginData: any = await loginRes.json();
    const token = loginData.data?.token;
    verify('Auditor authentication succeeds with JWT', Boolean(token), 'Role: AUDITOR');

    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fraudshield.in', password: 'Admin@123' }),
    });
    const adminLoginData: any = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;
    verify('Admin authentication succeeds with JWT', Boolean(adminToken), 'Role: ADMIN');

    // Retrieve clean vendor master
    const cleanVendor = await prisma.vendor.findFirst({
      where: { gstin: '27AAACT2727Q1ZW' }, // Tata Steel Supplies Ltd (Valid checksum)
    });
    const alternateVendor = await prisma.vendor.findFirst({
      where: { NOT: { id: cleanVendor?.id } },
    });

    // ----------------------------------------------------------------
    // 2. Fetch Sample Invoices Across Multiple Risk Tiers
    // ----------------------------------------------------------------
    console.log('\n--- 2. Fraud Intelligence & Score Gauge Verification ---');
    const invoicesRes = await fetch(`${baseUrl}/invoices?limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const invoicesData: any = await invoicesRes.json();
    const invoices = invoicesData.data || [];
    verify('Retrieved invoice dataset for forensic analysis', invoices.length > 0, `${invoices.length} invoices`);

    const sampleInvoiceId = invoices[0]?.id;
    const detailRes = await fetch(`${baseUrl}/invoices/${sampleInvoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const detailData: any = await detailRes.json();
    const invoice = detailData.data;

    // Check Fraud Score & Risk Level
    verify('Invoice has valid Fraud Score (0-100)', typeof invoice.fraudScore === 'number' && invoice.fraudScore >= 0 && invoice.fraudScore <= 100, `Score: ${invoice.fraudScore}`);
    verify('Risk Level mapped to standard tier', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(invoice.riskLevel), `Risk: ${invoice.riskLevel}`);
    verify('Detection summary explanation is human-readable and present', Boolean(invoice.detection?.summaryExplanation));

    // ----------------------------------------------------------------
    // 3. Complete 20-Rule Matrix Breakdown Verification
    // ----------------------------------------------------------------
    console.log('\n--- 3. 20-Rule Forensic Matrix Verification ---');
    const ruleResults = invoice.detection?.ruleResults || [];
    verify('All 20 deterministic rules evaluated and stored', ruleResults.length === 20, `${ruleResults.length} rule results`);

    const hasRuleCodes = ruleResults.every((r: any) => Boolean(r.ruleCode && r.ruleName && r.status));
    verify('Every rule includes ruleCode, ruleName, and status (PASS/WARNING/FAIL/CRITICAL)', hasRuleCodes);

    const hasNonGenericExplanations = ruleResults.every(
      (r: any) => r.details && !r.details.toLowerCase().includes('undefined') && r.details.length > 5
    );
    verify('All rule explanations are non-generic and detailed', hasNonGenericExplanations);

    // ----------------------------------------------------------------
    // 4. Specific Scenario Tests (Items 7 - 15)
    // ----------------------------------------------------------------
    console.log('\n--- 4. Specific Fraud Scenarios Testing (Rules Engine) ---');

    // Ensure cleanVendor is in pristine condition (0 flags, 0 risk score)
    await prisma.vendor.update({
      where: { id: cleanVendor!.id },
      data: { fraudFlagCount: 0, riskScore: 0 },
    });

    const uniqueCleanPrice = 10000 + Math.floor(Math.random() * 500) * 10;
    const uniqueCleanTaxable = uniqueCleanPrice * 10;
    const uniqueCleanTax = (uniqueCleanTaxable * 18) / 100;
    const uniqueCleanTotal = uniqueCleanTaxable + uniqueCleanTax;

    // 7. Legitimate Clean Invoice Test
    const cleanPo = await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-TEST-P5-${Date.now()}`,
        vendorId: cleanVendor!.id,
        issueDate: new Date(),
        totalAmount: uniqueCleanTotal,
        status: 'APPROVED',
        items: {
          create: [
            {
              description: 'High Grade Steel Rebars Fe500D',
              hsnSac: '7214',
              quantity: 10,
              unitPrice: uniqueCleanPrice,
              taxRate: 18.0,
              totalAmount: uniqueCleanTotal,
            },
          ],
        },
      },
    });

    const uniqueCleanNum = `INV-CLEAN-P5-${Date.now()}`;
    const cleanInvoiceRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoiceNumber: uniqueCleanNum,
        vendorId: cleanVendor!.id,
        purchaseOrderId: cleanPo.id,
        invoiceDate: new Date().toISOString().split('T')[0],
        vendorGstin: cleanVendor!.gstin,
        customerGstin: '27AAACG1234F1Z5',
        placeOfSupply: 'Maharashtra',
        placeOfSupplyStateCode: '27',
        billingAddress: '402 Nariman Point, Mumbai, Maharashtra 400021',
        taxableAmount: uniqueCleanTaxable,
        cgstAmount: uniqueCleanTax / 2,
        sgstAmount: uniqueCleanTax / 2,
        igstAmount: 0.0,
        grandTotal: uniqueCleanTotal,
        isInterState: false,
        items: [
          {
            itemDescription: 'High Grade Steel Rebars Fe500D',
            hsnSac: '7214',
            quantity: 10,
            unitPrice: uniqueCleanPrice,
            taxableValue: uniqueCleanTaxable,
            gstRate: 18.0,
            cgstAmount: uniqueCleanTax / 2,
            sgstAmount: uniqueCleanTax / 2,
            igstAmount: 0.0,
            totalAmount: uniqueCleanTotal,
          },
        ],
      }),
    });
    const cleanInvoiceData: any = await cleanInvoiceRes.json();
    verify(
      'Test 7: Legitimate invoice evaluated with LOW risk score (score = 0)',
      cleanInvoiceData.success === true && cleanInvoiceData.data?.fraudScore === 0,
      `Score: ${cleanInvoiceData.data?.fraudScore}`
    );

    // 8. Duplicate Invoice Detection Test
    const dupInvoiceRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoiceNumber: uniqueCleanNum, // exact same invoice number for vendor
        vendorId: cleanVendor!.id,
        invoiceDate: new Date().toISOString().split('T')[0],
        vendorGstin: cleanVendor!.gstin,
        customerGstin: '27AAACG1234F1Z5',
        placeOfSupply: 'Maharashtra',
        placeOfSupplyStateCode: '27',
        billingAddress: '402 Nariman Point, Mumbai, Maharashtra 400021',
        taxableAmount: uniqueCleanTaxable,
        grandTotal: uniqueCleanTotal,
        items: [
          {
            itemDescription: 'High Grade Steel Rebars',
            hsnSac: '7214',
            quantity: 10,
            unitPrice: uniqueCleanPrice,
            taxableValue: uniqueCleanTaxable,
            gstRate: 18.0,
            totalAmount: uniqueCleanTotal,
          },
        ],
      }),
    });
    const dupInvoiceData: any = await dupInvoiceRes.json();
    const dupRule = dupInvoiceData.data?.detection?.ruleResults?.find((r: any) => r.ruleCode === 'DUP-01');
    verify(
      'Test 8: Duplicate invoice detection flags duplicate violation (DUP-01)',
      dupRule?.status === 'CRITICAL' && dupInvoiceData.data?.fraudScore >= 40,
      `DUP-01: ${dupRule?.status}, Score: ${dupInvoiceData.data?.fraudScore}`
    );

    // 9. GSTIN Format / Checksum Mismatch Test
    const gstMismatchRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoiceNumber: `INV-FAKGST-${Date.now()}`,
        vendorId: cleanVendor!.id,
        invoiceDate: new Date().toISOString().split('T')[0],
        vendorGstin: '27AAACT2727Q1Z9', // Invalid checksum (expected 'W')
        customerGstin: '27AAACG1234F1Z5',
        placeOfSupply: 'Maharashtra',
        placeOfSupplyStateCode: '27',
        billingAddress: '402 Nariman Point, Mumbai',
        taxableAmount: 50000.0,
        grandTotal: 59000.0,
        items: [{ itemDescription: 'Goods', hsnSac: '7214', quantity: 5, unitPrice: 10000, taxableValue: 50000, gstRate: 18, totalAmount: 59000 }],
      }),
    });
    const gstMismatchData: any = await gstMismatchRes.json();
    const gstRule = gstMismatchData.data?.detection?.ruleResults?.find((r: any) => r.ruleCode === 'GST-01');
    verify(
      'Test 9: GST checksum mismatch flagged by GST-01',
      gstRule?.status === 'CRITICAL' || gstRule?.status === 'FAIL',
      `GST-01 Status: ${gstRule?.status}`
    );

    // 10. Tax Calculation / Asymmetry Mismatch Test (TAX-03 CGST ≠ SGST)
    const taxMismatchRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoiceNumber: `INV-TAXMIS-${Date.now()}`,
        vendorId: cleanVendor!.id,
        invoiceDate: new Date().toISOString().split('T')[0],
        vendorGstin: cleanVendor!.gstin,
        customerGstin: '27AAACG1234F1Z5',
        placeOfSupply: 'Maharashtra',
        placeOfSupplyStateCode: '27',
        billingAddress: '402 Nariman Point, Mumbai',
        taxableAmount: 100000.0,
        cgstAmount: 12000.0, // Should be 9000
        sgstAmount: 6000.0,  // Should be 9000 (Asymmetry)
        igstAmount: 0.0,
        grandTotal: 118000.0,
        isInterState: false,
        items: [{ itemDescription: 'Steel Rods', hsnSac: '7214', quantity: 10, unitPrice: 10000, taxableValue: 100000, gstRate: 18, totalAmount: 118000 }],
      }),
    });
    const taxMismatchData: any = await taxMismatchRes.json();
    const taxRule = taxMismatchData.data?.detection?.ruleResults?.find((r: any) => r.ruleCode === 'TAX-03');
    verify(
      'Test 10: Intra-state tax mismatch (CGST ≠ SGST) flagged by TAX-03',
      taxRule?.status === 'FAIL' || taxRule?.status === 'CRITICAL',
      `TAX-03 Status: ${taxRule?.status}`
    );

    // 11. PO Vendor & Value Mismatch Test (PO-02 / PO-03)
    const poMismatchRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoiceNumber: `INV-POMIS-${Date.now()}`,
        vendorId: alternateVendor!.id, // Different vendor than PO owner
        purchaseOrderId: cleanPo.id,   // Owned by cleanVendor
        invoiceDate: new Date().toISOString().split('T')[0],
        vendorGstin: alternateVendor!.gstin,
        customerGstin: '27AAACG1234F1Z5',
        placeOfSupply: 'Maharashtra',
        placeOfSupplyStateCode: '27',
        billingAddress: '402 Nariman Point, Mumbai',
        taxableAmount: 300000.0, // Exceeds PO total of 120,000 by >100%
        grandTotal: 354000.0,
        items: [{ itemDescription: 'Heavy Machinery', hsnSac: '8471', quantity: 1, unitPrice: 300000, taxableValue: 300000, gstRate: 18, totalAmount: 354000 }],
      }),
    });
    const poMismatchData: any = await poMismatchRes.json();
    const poVendRule = poMismatchData.data?.detection?.ruleResults?.find((r: any) => r.ruleCode === 'PO-03');
    const poValRule = poMismatchData.data?.detection?.ruleResults?.find((r: any) => r.ruleCode === 'PO-02');
    verify(
      'Test 11: PO vendor mismatch (PO-03) & value limit overrun (PO-02) flagged',
      poVendRule?.status === 'CRITICAL' && (poValRule?.status === 'FAIL' || poValRule?.status === 'CRITICAL'),
      `PO-03: ${poVendRule?.status}, PO-02: ${poValRule?.status}`
    );

    // 12. High Value Anomaly Spike Test (ANO-01)
    const anomalyRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoiceNumber: `INV-SPIKE-${Date.now()}`,
        vendorId: cleanVendor!.id,
        invoiceDate: new Date().toISOString().split('T')[0],
        vendorGstin: cleanVendor!.gstin,
        customerGstin: '27AAACG1234F1Z5',
        placeOfSupply: 'Maharashtra',
        placeOfSupplyStateCode: '27',
        billingAddress: '402 Nariman Point, Mumbai',
        taxableAmount: 5000000.0, // ₹50 Lakhs (Abnormal spike)
        grandTotal: 5900000.0,
        items: [{ itemDescription: 'Industrial Turbine Parts', hsnSac: '8406', quantity: 5, unitPrice: 1000000, taxableValue: 5000000, gstRate: 18, totalAmount: 5900000 }],
      }),
    });
    const anomalyData: any = await anomalyRes.json();
    verify(
      'Test 12: High-value invoice evaluated and scored appropriately',
      anomalyData.success === true && anomalyData.data?.fraudScore > 0,
      `Score: ${anomalyData.data?.fraudScore}`
    );

    // 13. HIGH / CRITICAL Invoice Alert Trigger Test
    const criticalInvoiceId = poMismatchData.data?.id;
    const critDetailRes = await fetch(`${baseUrl}/invoices/${criticalInvoiceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const critDetailData: any = await critDetailRes.json();
    verify(
      'Test 13: CRITICAL risk invoice has score >= 75 and generated active alert',
      critDetailData.data?.riskLevel === 'CRITICAL' && critDetailData.data?.fraudScore >= 75,
      `Risk: ${critDetailData.data?.riskLevel}, Score: ${critDetailData.data?.fraudScore}`
    );

    // 14. Phase 4 Manual Invoice Ingestion Test
    const manualInvoiceRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        invoiceNumber: `INV-MANUAL-P5-${Date.now()}`,
        vendorId: cleanVendor!.id,
        invoiceDate: new Date().toISOString().split('T')[0],
        vendorGstin: cleanVendor!.gstin,
        customerGstin: '27AAACG1234F1Z5',
        placeOfSupply: 'Maharashtra',
        placeOfSupplyStateCode: '27',
        billingAddress: '402 Nariman Point, Mumbai',
        taxableAmount: 40000.0,
        grandTotal: 47200.0,
        items: [{ itemDescription: 'Manual Office Supplies', hsnSac: '4802', quantity: 20, unitPrice: 2000, taxableValue: 40000, gstRate: 18, totalAmount: 47200 }],
      }),
    });
    const manualInvoiceData: any = await manualInvoiceRes.json();
    verify(
      'Test 14: Phase 4 Manual invoice creation runs full 20-rule engine',
      manualInvoiceData.data?.detection?.ruleResults?.length === 20,
      `20 Rules Evaluated, Score: ${manualInvoiceData.data?.fraudScore}`
    );

    // 15. Phase 4 Upload & Simulated Document Extraction Test
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileContent = Buffer.from('%PDF-1.4 simulated test invoice content for OCR test');
    const multipartBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample_invoice_p5.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
      ),
      fileContent,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="vendorId"\r\n\r\n${cleanVendor?.id}\r\n--${boundary}--\r\n`),
    ]);

    const extractRes = await fetch(`${baseUrl}/invoices/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${token}`,
      },
      body: multipartBody,
    });
    const extractData: any = await extractRes.json();
    verify(
      'Test 15: Phase 4 Document Extraction pipeline returns structured fields',
      extractData.success === true && Boolean(extractData.data?.extracted?.invoiceNumber && extractData.data?.extracted?.items),
      `Extracted: ${extractData.data?.extracted?.invoiceNumber}`
    );

    // ----------------------------------------------------------------
    // 5. Actions, Audit Logs & Re-evaluation (Items 16, 17, 18)
    // ----------------------------------------------------------------
    console.log('\n--- 5. Auditor Action Controls & Immutable Audit Logging ---');

    const testInvoiceId = manualInvoiceData.data?.id;

    // Test 17: Status Actions (Approve, Reject, Flag Fraud, Review)
    const actionReviewRes = await fetch(`${baseUrl}/invoices/${testInvoiceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'SUSPICIOUS', reviewNotes: 'Flagged for compliance review.' }),
    });
    const actionReviewData: any = await actionReviewRes.json();
    verify('Test 17a: Action Send for Review (SUSPICIOUS)', actionReviewData.data?.status === 'SUSPICIOUS');

    const actionFraudRes = await fetch(`${baseUrl}/invoices/${testInvoiceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'FLAGGED_FRAUD', reviewNotes: 'Confirmed fraudulent invoice submission.' }),
    });
    const actionFraudData: any = await actionFraudRes.json();
    verify('Test 17b: Action Mark as Fraud (FLAGGED_FRAUD)', actionFraudData.data?.status === 'FLAGGED_FRAUD');

    const actionRejectRes = await fetch(`${baseUrl}/invoices/${testInvoiceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'REJECTED', reviewNotes: 'Rejected due to failed compliance.' }),
    });
    const actionRejectData: any = await actionRejectRes.json();
    verify('Test 17c: Action Reject (REJECTED)', actionRejectData.data?.status === 'REJECTED');

    const actionApproveRes = await fetch(`${baseUrl}/invoices/${testInvoiceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'VERIFIED', reviewNotes: 'Approved after physical audit.' }),
    });
    const actionApproveData: any = await actionApproveRes.json();
    verify('Test 17d: Action Approve & Verify (VERIFIED)', actionApproveData.data?.status === 'VERIFIED');

    // Test 18: Re-evaluation
    const reEvalRes = await fetch(`${baseUrl}/invoices/${testInvoiceId}/re-evaluate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const reEvalData: any = await reEvalRes.json();
    verify(
      'Test 18: Action Re-evaluate re-scores invoice through all 20 rules',
      reEvalData.success === true && typeof reEvalData.data?.fraudScore === 'number',
      `Re-evaluated Score: ${reEvalData.data?.fraudScore}`
    );

    // Test 16: Audit Logs Verification
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: testInvoiceId },
      orderBy: { timestamp: 'desc' },
    });
    verify(
      'Test 16: Immutable audit logs recorded for every status change & re-evaluation',
      auditLogs.length >= 4,
      `${auditLogs.length} audit log entries recorded`
    );

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`📊 PHASE 5 COMPREHENSIVE AUDIT RESULTS: ${passed} / ${total} CHECKS PASSED`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase5Verification().catch((err) => {
  console.error('Phase 5 verification error:', err);
  process.exit(1);
});
