import { AuthService } from '../services/auth.service';
import { InvoiceService } from '../services/invoice.service';
import { VendorService } from '../services/vendor.service';
import { PurchaseOrderService } from '../services/purchaseOrder.service';
import { FraudService } from '../services/fraud.service';
import { AnalyticsService } from '../services/analytics.service';
import { ReportService } from '../services/report.service';
import { AuditService } from '../services/audit.service';

async function runApiVerification() {
  console.log('🌐 Starting Backend REST API & Services Verification...\n');

  let passed = 0;
  let total = 0;

  function check(condition: boolean, label: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${label}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${label}`);
    }
  }

  // 1. Auth Service
  console.log('--- 1. Auth Service Verification ---');
  const loginRes = await AuthService.login({
    email: 'admin@fraudshield.in',
    password: 'Admin@123',
  });
  check(Boolean(loginRes.token), 'Admin Login returns JWT token');
  check(loginRes.user.role === 'ADMIN', 'Admin User role is ADMIN');

  const profile = await AuthService.getProfile(loginRes.user.id);
  check(profile.email === 'admin@fraudshield.in', 'Get Profile returns correct user');

  // 2. Vendors Service
  console.log('\n--- 2. Vendor Service Verification ---');
  const vendorsList = await VendorService.getVendors({ limit: 5 });
  check(vendorsList.data.length > 0, `Vendors list returned ${vendorsList.data.length} vendors`);
  check(vendorsList.pagination.total >= 15, `Total vendors in database: ${vendorsList.pagination.total}`);

  const sampleVendor = vendorsList.data[0];
  const vendorDetails = await VendorService.getVendorById(sampleVendor.id);
  check(vendorDetails.gstin === sampleVendor.gstin, `Fetched vendor details for ${vendorDetails.name}`);

  // 3. Purchase Orders Service
  console.log('\n--- 3. Purchase Order Service Verification ---');
  const poList = await PurchaseOrderService.getPurchaseOrders({ limit: 5 });
  check(poList.data.length > 0, `PO list returned ${poList.data.length} orders`);

  // 4. Invoices Service (List, Filter, Details, Status, Creation)
  console.log('\n--- 4. Invoice Service Verification ---');
  const invoicesList = await InvoiceService.getInvoices({ limit: 10 });
  check(invoicesList.data.length > 0, `Invoices list returned ${invoicesList.data.length} records`);
  check(invoicesList.pagination.total >= 60, `Total seeded invoices: ${invoicesList.pagination.total}`);

  const sampleInvoice = invoicesList.data[0];
  const invoiceDetails = await InvoiceService.getInvoiceById(sampleInvoice.id);
  check(invoiceDetails.invoiceNumber === sampleInvoice.invoiceNumber, `Fetched invoice details for #${invoiceDetails.invoiceNumber}`);
  check(invoiceDetails.detection !== null, 'Invoice includes FraudDetection relation');
  check((invoiceDetails.detection?.ruleResults.length || 0) > 0, 'Detection includes itemized rule results');

  // Test status update
  const updatedInv = await InvoiceService.updateInvoiceStatus(
    sampleInvoice.id,
    'VERIFIED',
    'Auditor manual signoff verification completed.',
    loginRes.user.id
  );
  check(updatedInv.status === 'VERIFIED', 'Invoice status updated to VERIFIED');

  // 5. Fraud Alerts Service
  console.log('\n--- 5. Fraud Alerts Service Verification ---');
  const alertsList = await FraudService.getAlerts({ limit: 5 });
  check(alertsList.data.length > 0, `Alerts list returned ${alertsList.data.length} alerts`);

  const rulesList = FraudService.getRules();
  check(rulesList.length === 20, `Rule registry contains ${rulesList.length} active rules`);

  // 6. Analytics Service
  console.log('\n--- 6. Analytics Service Verification ---');
  const dashboardStats = await AnalyticsService.getDashboardStats();
  check(dashboardStats.totalInvoices > 0, `Dashboard Total Invoices: ${dashboardStats.totalInvoices}`);
  check(dashboardStats.totalInvoiceValue > 0, `Dashboard Total Value: ₹${dashboardStats.totalInvoiceValue.toLocaleString('en-IN')}`);
  check(dashboardStats.totalAmountAtRisk > 0, `Dashboard Amount at Risk: ₹${dashboardStats.totalAmountAtRisk.toLocaleString('en-IN')}`);
  check(dashboardStats.fraudRate >= 0, `Dashboard Fraud Rate: ${dashboardStats.fraudRate}%`);

  const trends = await AnalyticsService.getFraudTrends();
  check(trends.length > 0, `Fraud trends generated for ${trends.length} monthly periods`);

  const vendorRiskMatrix = await AnalyticsService.getVendorRiskMatrix();
  check(vendorRiskMatrix.length > 0, `Vendor risk matrix generated for top ${vendorRiskMatrix.length} suppliers`);

  // 7. Reports Service
  console.log('\n--- 7. Reports Service Verification ---');
  const csvData = await ReportService.generateInvoiceCSV({ limit: 10 } as any);
  check(csvData.includes('Invoice Number') && csvData.includes('Vendor GSTIN'), 'CSV Export includes correct Indian GST headers');

  const fraudSummary = await ReportService.getFraudSummaryReport();
  check(fraudSummary.currency === 'INR (₹)', 'Report formatted in Indian Rupee currency (₹)');

  // 8. Audit Logs Service
  console.log('\n--- 8. Audit Logs Service Verification ---');
  const auditLogs = await AuditService.getLogs({ limit: 10 });
  check(auditLogs.data.length > 0, `Audit logs returned ${auditLogs.data.length} historical audit entries`);

  console.log(`\n====================================================`);
  console.log(`🎉 API & Services Verification Passed: ${passed}/${total} checks!`);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runApiVerification().catch((err) => {
  console.error('API Verification error:', err);
  process.exit(1);
});
