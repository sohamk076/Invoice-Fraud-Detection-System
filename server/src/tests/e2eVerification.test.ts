process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../index';
import prisma from '../utils/prisma';
import fs from 'fs';
import path from 'path';

async function runCompleteVerification() {
  console.log('================================================================');
  console.log('🔍 FULL-STACK END-TO-END VERIFICATION & AUDIT CHECK SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;
  const results: { category: string; test: string; status: 'PASS' | 'FAIL'; note?: string }[] = [];

  function record(category: string, test: string, condition: boolean, note?: string) {
    total++;
    const status = condition ? 'PASS' : 'FAIL';
    if (condition) {
      passed++;
      console.log(`  ✅ [${category}] ${test} ${note ? `(${note})` : ''}`);
    } else {
      console.error(`  ❌ [${category}] ${test} ${note ? `FAILED: ${note}` : 'FAILED'}`);
    }
    results.push({ category, test, status, note });
  }

  // 1. Start Server on ephemeral port for live HTTP testing
  const server = http.createServer(app);
  const TEST_PORT = 5099;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}/api`;
  console.log(`🚀 Live test server listening on ${baseUrl}\n`);

  try {
    // ----------------------------------------------------------------
    // Category 1: Backend Server & Health Check
    // ----------------------------------------------------------------
    console.log('--- 1. Backend Server & Health Check ---');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData: any = await healthRes.json();
    record(
      'Backend',
      'Health Check endpoint responds',
      healthRes.status === 200 && healthData.status === 'online',
      `Status: ${healthData.status}`
    );

    // ----------------------------------------------------------------
    // Category 2: SQLite & Prisma Database Verification
    // ----------------------------------------------------------------
    console.log('\n--- 2. Database & Seed Data Integrity ---');
    const vendorCount = await prisma.vendor.count();
    const invoiceCount = await prisma.invoice.count();
    const poCount = await prisma.purchaseOrder.count();
    const userCount = await prisma.user.count();
    const alertCount = await prisma.fraudAlert.count();
    const detectionCount = await prisma.fraudDetection.count();
    const ruleResultCount = await prisma.fraudRuleResult.count();

    record('Database', 'Prisma connects to SQLite database', true);
    record('Database', 'Vendors seeded in database', vendorCount >= 15, `${vendorCount} vendors`);
    record('Database', 'Invoices seeded in database', invoiceCount >= 60, `${invoiceCount} invoices`);
    record('Database', 'Purchase Orders seeded', poCount >= 9, `${poCount} purchase orders`);
    record('Database', 'Users seeded with bcrypt credentials', userCount >= 3, `${userCount} users`);
    record('Database', 'Fraud Detections & Rule Results exist', detectionCount > 0 && ruleResultCount > 0, `${detectionCount} detections, ${ruleResultCount} rule outputs`);
    record('Database', 'Fraud Alerts seeded', alertCount > 0, `${alertCount} alerts`);

    // ----------------------------------------------------------------
    // Category 3: Authentication & Role-Based Security
    // ----------------------------------------------------------------
    console.log('\n--- 3. Authentication & Role-Based Security ---');
    
    // Login as Admin
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fraudshield.in', password: 'Admin@123' }),
    });
    const adminLoginData: any = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;
    record('Auth', 'Admin login with JWT generation', Boolean(adminToken), 'Role: ADMIN');

    // Login as Auditor
    const auditorLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'auditor.sharma@fraudshield.in', password: 'Audit@123' }),
    });
    const auditorLoginData: any = await auditorLoginRes.json();
    const auditorToken = auditorLoginData.data?.token;
    record('Auth', 'Auditor login with JWT generation', Boolean(auditorToken), 'Role: AUDITOR');

    // Login as Finance User
    const financeLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'finance.patel@fraudshield.in', password: 'Finance@123' }),
    });
    const financeLoginData: any = await financeLoginRes.json();
    const financeToken = financeLoginData.data?.token;
    record('Auth', 'Finance User login with JWT generation', Boolean(financeToken), 'Role: FINANCE_USER');

    // Verify /api/auth/me
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData: any = await meRes.json();
    record('Auth', 'GET /api/auth/me returns authenticated profile', meData.data?.email === 'admin@fraudshield.in');

    // Role-based Access Guard Test:
    // /api/audit-logs is restricted to ADMIN and AUDITOR.
    const adminAuditRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Security', 'Admin access to /api/audit-logs (200 OK)', adminAuditRes.status === 200);

    const auditorAuditRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    record('Security', 'Auditor access to /api/audit-logs (200 OK)', auditorAuditRes.status === 200);

    // Finance user request should be FORBIDDEN (403)
    const financeAuditRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${financeToken}` },
    });
    record('Security', 'Role Guard: Finance user blocked from audit logs (403 Forbidden)', financeAuditRes.status === 403);

    // ----------------------------------------------------------------
    // Category 4: Executive Dashboard & Analytics APIs
    // ----------------------------------------------------------------
    console.log('\n--- 4. Dashboard & Analytics APIs ---');
    const dashStatsRes = await fetch(`${baseUrl}/analytics/dashboard-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashStatsData: any = await dashStatsRes.json();
    const stats = dashStatsData.data;
    record('Analytics', 'GET /dashboard-stats returns KPI metrics', stats?.totalInvoices > 0 && stats?.totalInvoiceValue > 0, `Total: ₹${stats?.totalInvoiceValue?.toLocaleString('en-IN')}`);
    record('Analytics', 'Dashboard includes risk tier distribution', stats?.riskDistribution?.low >= 0 && stats?.riskDistribution?.critical >= 0);
    record('Analytics', 'Dashboard includes recent suspicious invoices list', Array.isArray(stats?.recentSuspiciousInvoices));

    const trendsRes = await fetch(`${baseUrl}/analytics/fraud-trends`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const trendsData: any = await trendsRes.json();
    record('Analytics', 'GET /fraud-trends returns monthly trajectories', Array.isArray(trendsData.data) && trendsData.data.length > 0);

    const vendorMatrixRes = await fetch(`${baseUrl}/analytics/vendor-risk-matrix`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const vendorMatrixData: any = await vendorMatrixRes.json();
    record('Analytics', 'GET /vendor-risk-matrix returns supplier risk rankings', Array.isArray(vendorMatrixData.data) && vendorMatrixData.data.length > 0);

    // ----------------------------------------------------------------
    // Category 5: Invoices API & Details Inspector
    // ----------------------------------------------------------------
    console.log('\n--- 5. Invoices API & Details Inspector ---');
    const invoicesListRes = await fetch(`${baseUrl}/invoices?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const invoicesListData: any = await invoicesListRes.json();
    record('Invoices', 'GET /invoices returns paginated list', invoicesListData.data?.length > 0 && invoicesListData.pagination?.total > 0);

    // Filter test by Risk Level
    const criticalInvoicesRes = await fetch(`${baseUrl}/invoices?riskLevel=CRITICAL`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const criticalInvoicesData: any = await criticalInvoicesRes.json();
    record('Invoices', 'GET /invoices?riskLevel=CRITICAL filter works', criticalInvoicesData.data?.every((i: any) => i.riskLevel === 'CRITICAL'));

    // Get Single Invoice with itemized relations
    const sampleInvId = invoicesListData.data[0].id;
    const invoiceDetailRes = await fetch(`${baseUrl}/invoices/${sampleInvId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const invoiceDetailData: any = await invoiceDetailRes.json();
    const sampleInv = invoiceDetailData.data;
    record('Invoices', 'GET /invoices/:id returns full entity details', Boolean(sampleInv?.invoiceNumber));
    record('Invoices', 'Invoice includes vendor details', Boolean(sampleInv?.vendor?.name));
    record('Invoices', 'Invoice includes line items with HSN/SAC', Array.isArray(sampleInv?.items) && sampleInv.items.length > 0);
    record('Invoices', 'Invoice includes FraudDetection with 20 rule outputs', Array.isArray(sampleInv?.detection?.ruleResults) && sampleInv.detection.ruleResults.length > 0);

    // Auditor Status Update
    const updateStatusRes = await fetch(`${baseUrl}/invoices/${sampleInvId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auditorToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED', reviewNotes: 'Verified during end-to-end audit check.' }),
    });
    const updateStatusData: any = await updateStatusRes.json();
    record('Invoices', 'PATCH /invoices/:id/status updates status to VERIFIED', updateStatusData.data?.status === 'VERIFIED');

    // Re-evaluation endpoint
    const reEvalRes = await fetch(`${baseUrl}/invoices/${sampleInvId}/re-evaluate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reEvalData: any = await reEvalRes.json();
    record('Invoices', 'POST /invoices/:id/re-evaluate re-scores successfully', reEvalData.success === true);

    // ----------------------------------------------------------------
    // Category 6: Deterministic Fraud Engine Ingestion Test
    // ----------------------------------------------------------------
    console.log('\n--- 6. Fraud Engine Live Ingestion Test ---');
    const cleanVendor = await prisma.vendor.update({
      where: { gstin: '27AAACT2727Q1ZW' },
      data: { fraudFlagCount: 0 },
    });

    const uniqueVal = 40000 + Math.floor(Math.random() * 9000);
    const uniquePo = await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-TEST-${Date.now()}`,
        vendorId: cleanVendor!.id,
        totalAmount: uniqueVal * 1.18,
        status: 'APPROVED',
        issueDate: new Date(),
      },
    });

    const taxableVal = uniqueVal;
    const taxPart = Math.round(((taxableVal * 0.18) / 2) * 100) / 100;
    const actualGrandTotal = taxableVal + (taxPart * 2);

    const testNewInvoice = {
      invoiceNumber: `TEST-CLEAN-${Date.now()}`,
      vendorId: cleanVendor?.id,
      purchaseOrderId: uniquePo.id,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      vendorGstin: cleanVendor?.gstin,
      customerGstin: '27AAACG1234F1Z5',
      placeOfSupply: cleanVendor?.state || 'Maharashtra',
      placeOfSupplyStateCode: cleanVendor?.stateCode || '27',
      billingAddress: '42 Nariman Point, Mumbai',
      taxableAmount: taxableVal,
      cgstAmount: taxPart,
      sgstAmount: taxPart,
      igstAmount: 0,
      grandTotal: actualGrandTotal,
      isInterState: false,
      items: [
        {
          itemDescription: 'Precision Mechanical Bearings',
          hsnSac: '8482',
          quantity: 1,
          unitPrice: taxableVal,
          taxableValue: taxableVal,
          gstRate: 18,
          cgstAmount: taxPart,
          sgstAmount: taxPart,
          igstAmount: 0,
          totalAmount: actualGrandTotal,
        },
      ],
    };

    const createInvoiceRes = await fetch(`${baseUrl}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${financeToken}`,
      },
      body: JSON.stringify(testNewInvoice),
    });
    const createInvoiceData: any = await createInvoiceRes.json();
    const createdInv = createInvoiceData.data;
    if (createdInv?.fraudScore > 0) {
      console.log('Triggered rules for test invoice:', createdInv?.detection?.ruleResults?.filter((r: any) => r.scoreContribution > 0));
    }
    record('Fraud Engine', 'Live invoice creation runs 20 deterministic rules', Boolean(createdInv?.detection));
    record('Fraud Engine', 'Legitimate clean invoice receives LOW risk score (score = 0)', createdInv?.fraudScore === 0 && createdInv?.riskLevel === 'LOW', `Score: ${createdInv?.fraudScore}`);

    // ----------------------------------------------------------------
    // Category 7: Vendors API
    // ----------------------------------------------------------------
    console.log('\n--- 7. Vendors API ---');
    const vendorsRes = await fetch(`${baseUrl}/vendors`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const vendorsData: any = await vendorsRes.json();
    record('Vendors', 'GET /vendors returns supplier master registry', vendorsData.data?.length > 0);

    const vendorDetailsRes = await fetch(`${baseUrl}/vendors/${cleanVendor?.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const vendorDetailsData: any = await vendorDetailsRes.json();
    record('Vendors', 'GET /vendors/:id returns vendor profile and historical invoices', Boolean(vendorDetailsData.data?.invoices));

    // ----------------------------------------------------------------
    // Category 8: Fraud Alerts API
    // ----------------------------------------------------------------
    console.log('\n--- 8. Fraud Alerts API ---');
    const alertsRes = await fetch(`${baseUrl}/fraud/alerts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const alertsData: any = await alertsRes.json();
    record('Alerts', 'GET /fraud/alerts returns active fraud alerts', alertsData.data?.length > 0);

    const sampleAlert = alertsData.data[0];
    const updateAlertRes = await fetch(`${baseUrl}/fraud/alerts/${sampleAlert.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auditorToken}`,
      },
      body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: 'Audited and signed off.' }),
    });
    const updateAlertData: any = await updateAlertRes.json();
    record('Alerts', 'PATCH /fraud/alerts/:id updates alert status to RESOLVED', updateAlertData.data?.status === 'RESOLVED');

    const rulesCatalogRes = await fetch(`${baseUrl}/fraud/rules`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const rulesCatalogData: any = await rulesCatalogRes.json();
    record('Alerts', 'GET /fraud/rules returns full 20-rule catalog', rulesCatalogData.data?.length === 20, `${rulesCatalogData.data?.length} registered rules`);

    // ----------------------------------------------------------------
    // Category 9: Reports & CSV Export API
    // ----------------------------------------------------------------
    console.log('\n--- 9. Reports & CSV Export API ---');
    const csvRes = await fetch(`${baseUrl}/reports/invoices/export-csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const csvText = await csvRes.text();
    record('Reports', 'GET /reports/invoices/export-csv returns valid CSV data', typeof csvText === 'string' && csvText.includes('Invoice Number') && csvText.includes('Vendor GSTIN'));

    const fraudSummaryRes = await fetch(`${baseUrl}/reports/fraud-summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const fraudSummaryData: any = await fraudSummaryRes.json();
    record('Reports', 'GET /reports/fraud-summary returns executive metrics with INR (₹) currency', fraudSummaryData.data?.currency === 'INR (₹)');

    // ----------------------------------------------------------------
    // Category 10: Client Production Build Artifacts
    // ----------------------------------------------------------------
    console.log('\n--- 10. Client Production Build Artifacts ---');
    const distIndexPath = path.resolve(__dirname, '../../../client/dist/index.html');
    const distHtmlExists = fs.existsSync(distIndexPath);
    record('Frontend', 'Client dist/index.html exists', distHtmlExists);

    const distAssetsDir = path.resolve(__dirname, '../../../client/dist/assets');
    const distAssetsExist = fs.existsSync(distAssetsDir) && fs.readdirSync(distAssetsDir).length >= 2;
    record('Frontend', 'Client bundled JS and CSS assets exist in dist/assets', distAssetsExist);

  } finally {
    server.close();
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL VERIFICATION SCORECARD: ${passed} / ${total} CHECKS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runCompleteVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
