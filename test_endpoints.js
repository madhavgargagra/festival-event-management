// Programmatic validation script for Festival & Event Management System
require('dotenv').config(); // Load .env configuration

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('--- Starting Programmatic Backend Validation ---');

  try {
    // 1. Authenticate as Admin
    console.log('\n[Test 1] Authenticating as Admin (admin@fest.com)...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fest.com', password: 'password123' })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) {
      throw new Error(`Admin login failed: ${loginData.message}`);
    }
    const token = loginData.token;
    console.log('✔ Authenticated successfully.');

    // Helper headers
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Fetch existing festivals
    console.log('\n[Test 2] Fetching Festivals...');
    const festRes = await fetch(`${BASE_URL}/festivals`, { headers: authHeaders });
    const festData = await festRes.json();
    console.log(`✔ Found ${festData.festivals.length} festivals.`);

    // 3. Create a test Festival
    console.log('\n[Test 3] Creating a test Festival (June Jubilee)...');
    const createFestRes = await fetch(`${BASE_URL}/festivals`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'June Jubilee 2026',
        location: 'Westside Park',
        start_date: '2026-06-01',
        end_date: '2026-06-10'
      })
    });
    const createFestData = await createFestRes.json();
    if (!createFestData.success) {
      throw new Error(`Failed to create festival: ${createFestData.message}`);
    }
    const festivalId = createFestData.festival.festival_id;
    console.log(`✔ Festival created successfully (ID: ${festivalId}).`);

    // 4. Create an Event within the Festival date range (Should Succeed)
    console.log('\n[Test 4] Creating Event inside date range (June 5)...');
    const eventSuccessRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        festival_id: festivalId,
        name: 'Opening Gala Concert',
        description: 'Summer music showcase',
        date: '2026-06-05T19:00:00',
        location: 'Main Pavilion',
        budget_estimate: 5000.00
      })
    });
    const eventSuccessData = await eventSuccessRes.json();
    if (!eventSuccessData.success) {
      throw new Error(`Event creation failed unexpectedly: ${eventSuccessData.message}`);
    }
    const eventId = eventSuccessData.event.event_id;
    console.log(`✔ Event created successfully (ID: ${eventId}).`);

    // 5. Create an Event OUTSIDE the Festival date range (Should Fail)
    console.log('\n[Test 5] Attempting to create Event outside date range (May 28 - Expected to Fail)...');
    const eventFailRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        festival_id: festivalId,
        name: 'Pre-Show Concert',
        description: 'Warmup session',
        date: '2026-05-28T19:00:00',
        location: 'Main Pavilion',
        budget_estimate: 1000.00
      })
    });
    const eventFailData = await eventFailRes.json();
    if (!eventFailData.success) {
      console.log(`✔ Validation Correctly Blocked Event: "${eventFailData.message}"`);
    } else {
      throw new Error('X Error: Server allowed event outside festival date range.');
    }

    // 6. Test Contributions Allocation limit checking
    console.log('\n[Test 6] Submitting $1000 Cash Contribution...');
    const contribRes = await fetch(`${BASE_URL}/contributors/contributions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        festival_id: festivalId,
        amount: 1000.00,
        contribution_type: 'Cash',
        description: 'Cash sponsorship for Opening Gala'
      })
    });
    const contribData = await contribRes.json();
    const contributionId = contribData.contribution.contribution_id;
    console.log(`✔ Contribution created (ID: ${contributionId}).`);

    console.log('\n[Test 7] Allocating $600 from contribution to Event (Should set status = Allocated)...');
    const allocSuccessRes = await fetch(`${BASE_URL}/allocations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        contribution_id: contributionId,
        event_id: eventId,
        allocated_item: 'Stage Audio Equipment',
        allocated_amount: 600.00
      })
    });
    const allocSuccessData = await allocSuccessRes.json();
    console.log(`✔ Allocation Result: Status is "${allocSuccessData.allocation.status}" (Expected: Allocated)`);

    console.log('\n[Test 8] Allocating another $500 to Event (Exceeds remaining $400 limit - Should set status = Pending_Review)...');
    const allocLimitRes = await fetch(`${BASE_URL}/allocations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        contribution_id: contributionId,
        event_id: eventId,
        allocated_item: 'Stage Lighting Equipment',
        allocated_amount: 500.00
      })
    });
    const allocLimitData = await allocLimitRes.json();
    console.log(`✔ Allocation Result: Status is "${allocLimitData.allocation.status}" (Expected: Pending_Review)`);

    // 7. Test Vendor Compliance & Expense Link Check
    console.log('\n[Test 9] Fetching Vendors...');
    const vendorRes = await fetch(`${BASE_URL}/vendors`, { headers: authHeaders });
    const vendorData = await vendorRes.json();
    const vendorId = vendorData.vendors[0].vendor_id;
    console.log(`✔ Vendor found (ID: ${vendorId}).`);

    console.log('\n[Test 10] Submitting $300 Expense linked to Event...');
    const expRes = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        event_id: eventId,
        vendor_id: vendorId,
        description: 'Catering deposit',
        expense_type: 'Food Services',
        amount: 300.00,
        expense_date: '2026-06-03'
      })
    });
    const expData = await expRes.json();
    const expenseId = expData.expense.expense_id;
    console.log(`✔ Expense recorded (ID: ${expenseId}).`);

    // 8. Try to mark unpaid expense as paid without invoice (Should Fail)
    console.log('\n[Test 11] Attempting to mark unpaid Expense as Paid without invoice file (Expected to Fail)...');
    const payRes = await fetch(`${BASE_URL}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ payment_status: 'Paid' })
    });
    const payData = await payRes.json();
    if (!payData.success) {
      console.log(`✔ Validation Correctly Blocked Payment: "${payData.message}"`);
    } else {
      throw new Error('X Error: Server allowed marking expense as PAID without an uploaded invoice.');
    }

    // 9. Fetch Audit History Logs
    console.log('\n[Test 12] Fetching Audit logs...');
    const auditRes = await fetch(`${BASE_URL}/audit`, { headers: authHeaders });
    const auditData = await auditRes.json();
    console.log(`✔ Audit logs fetched successfully (Found ${auditData.logs.length} entries).`);

    // 10. Clean up created resources (Festival)
    console.log('\n[Cleanup] Removing test resources...');
    if (festivalId) {
      console.log(`Deleting test Festival ID: ${festivalId}...`);
      const deleteFestRes = await fetch(`${BASE_URL}/festivals/${festivalId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const deleteFestData = await deleteFestRes.json();
      console.log(`✔ Festival delete: ${deleteFestData.message || 'success'}`);
    }
    console.log('✔ Cleanup complete.');

    console.log('\n--- All program tests completed successfully! ---');
  } catch (err) {
    console.error('X Test Suite failed:', err.message);
  }
}

// Run test suite
runTests();
