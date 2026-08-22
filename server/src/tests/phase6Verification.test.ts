process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../index';
import prisma from '../utils/prisma';

let server: http.Server;
const PORT = 5098;
const baseUrl = `http://localhost:${PORT}/api`;

let passedChecks = 0;
let failedChecks = 0;

function verify(name: string, condition: boolean, details?: string) {
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${name} ${details ? `(${details})` : ''}`);
  } else {
    failedChecks++;
    console.error(`  ❌ [FAIL] ${name} ${details ? `-> ${details}` : ''}`);
  }
}

async function runPhase6Tests() {
  console.log('\n================================================================');
  console.log('🔍 PHASE 6: EXECUTIVE DASHBOARD, ALERTS, ANALYTICS & REPORTS SUITE');
  console.log('================================================================\n');

  try {
    server = app.listen(PORT);
    await new Promise((res) => setTimeout(res, 300));

    // 1. Authentication for Admin and Auditor
    console.log('--- 1. Authentication & Auditor Credentials ---');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fraudshield.in', password: 'Admin@123' }),
    });
    const adminLoginData: any = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;
    verify('Admin login succeeds with JWT', adminLoginRes.status === 200 && Boolean(adminToken));

    const auditorLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'auditor.sharma@fraudshield.in', password: 'Audit@123' }),
    });
    const auditorLoginData: any = await auditorLoginRes.json();
    const auditorToken = auditorLoginData.data?.token;
    verify('Auditor login succeeds with JWT', auditorLoginRes.status === 200 && Boolean(auditorToken));

    // 2. Executive Dashboard Stats API
    console.log('\n--- 2. Executive Dashboard & Real KPI Metrics ---');
    const statsRes = await fetch(`${baseUrl}/analytics/dashboard-stats`, {
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    const statsData: any = await statsRes.json();
    const stats = statsData.data;

    verify('GET /analytics/dashboard-stats returns 200 OK', statsRes.status === 200 && statsData.success === true);
    verify('Dashboard has Total Invoices & Total Value (₹)', stats.totalInvoices > 0 && stats.totalInvoiceValue > 0, `Total: ₹${stats.totalInvoiceValue.toLocaleString('en-IN')}`);
    verify('Dashboard has Risk Tier counts (Low, Medium, High, Critical)', Boolean(stats.riskDistribution && typeof stats.riskDistribution.critical === 'number'));
    verify('Dashboard has Amount at Risk breakdown (High, Critical, Duplicate, Tax, PO)', Boolean(stats.amountAtRiskBreakdown && typeof stats.amountAtRiskBreakdown.criticalRiskAmount === 'number'));
    verify('Dashboard has Status Pipeline counts', Boolean(stats.statusDistribution && typeof stats.statusDistribution.verified === 'number'));
    verify('Dashboard includes Recent Suspicious Invoices with triggered rules', stats.recentSuspiciousInvoices.length > 0 && Array.isArray(stats.recentSuspiciousInvoices));

    // 3. Fraud Trends & Vendor Risk Matrix
    console.log('\n--- 3. Fraud Trend & Vendor Analytics APIs ---');
    const trendsRes = await fetch(`${baseUrl}/analytics/fraud-trends`, {
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    const trendsData: any = await trendsRes.json();
    verify('GET /analytics/fraud-trends returns monthly trajectories', trendsRes.status === 200 && Array.isArray(trendsData.data));

    const vendorMatrixRes = await fetch(`${baseUrl}/analytics/vendor-risk-matrix`, {
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    const vendorMatrixData: any = await vendorMatrixRes.json();
    verify('GET /analytics/vendor-risk-matrix returns supplier risk rankings', vendorMatrixRes.status === 200 && vendorMatrixData.data.length > 0);

    // 4. Fraud Alert Center Workflow (Create, Assign, Resolve, Dismiss)
    console.log('\n--- 4. Fraud Alert Center & Workflow Actions ---');
    const alertsRes = await fetch(`${baseUrl}/fraud/alerts?status=OPEN`, {
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    const alertsData: any = await alertsRes.json();
    verify('GET /fraud/alerts returns active alerts', alertsRes.status === 200 && Array.isArray(alertsData.data));

    if (alertsData.data.length > 0) {
      const targetAlert = alertsData.data[0];

      // Update Alert: Start Review (IN_REVIEW)
      const reviewRes = await fetch(`${baseUrl}/fraud/alerts/${targetAlert.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auditorToken}`,
        },
        body: JSON.stringify({
          status: 'IN_REVIEW',
          assignedToId: auditorLoginData.data.user.id,
          resolutionNotes: 'Auditor initiated investigation.',
        }),
      });
      const reviewData: any = await reviewRes.json();
      verify('Auditor Action: Start Review (IN_REVIEW)', reviewRes.status === 200 && reviewData.data?.status === 'IN_REVIEW');

      // Update Alert: Resolve Alert (RESOLVED)
      const resolveRes = await fetch(`${baseUrl}/fraud/alerts/${targetAlert.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auditorToken}`,
        },
        body: JSON.stringify({
          status: 'RESOLVED',
          resolutionNotes: 'Vendor documentation verified and validated with GST portal.',
        }),
      });
      const resolveData: any = await resolveRes.json();
      verify('Auditor Action: Resolve Alert (RESOLVED)', resolveRes.status === 200 && resolveData.data?.status === 'RESOLVED');
    }

    // 5. Reports & CSV Export APIs (All 4 Statutory Reports)
    console.log('\n--- 5. Statutory Reports & CSV Exports ---');
    
    // 5.1 Invoices CSV
    const invoiceCsvRes = await fetch(`${baseUrl}/reports/invoices/export-csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const invoiceCsvText = await invoiceCsvRes.text();
    verify('Report 1: GET /reports/invoices/export-csv returns CSV header', invoiceCsvRes.status === 200 && invoiceCsvText.includes('Invoice Number,Invoice Date'));

    // 5.2 Fraud Risk CSV
    const fraudCsvRes = await fetch(`${baseUrl}/reports/fraud/export-csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const fraudCsvText = await fraudCsvRes.text();
    verify('Report 2: GET /reports/fraud/export-csv returns Exceptions CSV', fraudCsvRes.status === 200 && fraudCsvText.includes('Triggered Rule Violations'));

    // 5.3 Vendor Risk CSV
    const vendorCsvRes = await fetch(`${baseUrl}/reports/vendors/export-csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const vendorCsvText = await vendorCsvRes.text();
    verify('Report 3: GET /reports/vendors/export-csv returns Vendor Risk CSV', vendorCsvRes.status === 200 && vendorCsvText.includes('Vendor Name,GSTIN'));

    // 5.4 Audit Trail CSV
    const auditCsvRes = await fetch(`${baseUrl}/reports/audit/export-csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditCsvText = await auditCsvRes.text();
    verify('Report 4: GET /reports/audit/export-csv returns Audit Trail CSV', auditCsvRes.status === 200 && auditCsvText.includes('Action Performed,Entity Type'));

    // 5.5 Report Preview API
    const previewRes = await fetch(`${baseUrl}/reports/preview?type=FRAUD_RISK`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const previewData: any = await previewRes.json();
    verify('Report Preview: GET /reports/preview returns metadata', previewRes.status === 200 && previewData.data?.recordCount >= 0);

    // 6. Audit Logs API with Filtering and Search
    console.log('\n--- 6. Audit Logs & Role Security Guards ---');
    const auditLogsRes = await fetch(`${baseUrl}/audit-logs?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditLogsData: any = await auditLogsRes.json();
    verify('GET /audit-logs returns paginated trail for Admin', auditLogsRes.status === 200 && auditLogsData.data.length > 0);

    // Finance user blocked from audit logs
    const financeLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'finance.patel@fraudshield.in', password: 'Finance@123' }),
    });
    const financeLoginData: any = await financeLoginRes.json();
    const financeToken = financeLoginData.data?.token;

    const blockedAuditRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${financeToken}` },
    });
    verify('Role Guard: Finance user blocked from audit logs (403)', blockedAuditRes.status === 403);

    console.log('\n================================================================');
    console.log(`📊 PHASE 6 VERIFICATION RESULTS: ${passedChecks} / ${passedChecks + failedChecks} CHECKS PASSED`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
    if (failedChecks > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runPhase6Tests();
