/**
 * Smoke Test — verify EverMemOS is reachable, can store, and can search.
 *
 * Usage: npm run smoke-test
 * Requires: EVERMIND_API_URL and EVERMIND_API_KEY in .env.local
 */

import 'dotenv/config';

const API_URL = process.env.EVERMIND_API_URL ?? 'http://localhost:1995/api/v1';
const API_KEY = process.env.EVERMIND_API_KEY ?? '';

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) h['Authorization'] = `Bearer ${API_KEY}`;
  return h;
}

async function smokeTest() {
  console.log(`Smoke testing ${API_URL}...\n`);

  // 1. Health check
  console.log('1. Health check...');
  try {
    const healthUrl = API_URL.replace('/api/v1', '') + '/health';
    const res = await fetch(healthUrl);
    const data = await res.json();
    console.log(`   ✓ Health: ${JSON.stringify(data)}\n`);
  } catch (err) {
    console.error(`   ✗ Health check failed: ${(err as Error).message}`);
    console.error('   Is EverMemOS running? Check EVERMIND_API_URL in .env.local\n');
    process.exit(1);
  }

  // 2. Store a test memory
  console.log('2. Storing test memory...');
  const testId = `smoke-test-${Date.now()}`;
  try {
    const res = await fetch(`${API_URL}/memories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        message_id: testId,
        create_time: new Date().toISOString(),
        sender: 'smoke_test_user',
        content: 'Smoke test memory — verifying EverMemOS integration works.',
        metadata: {
          group_id: 'user-smoke_test_user',
          tags: ['smoke-test'],
          scene: 'test',
        },
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`   ✓ Stored: ${testId}\n`);
    } else {
      console.error(`   ✗ Store failed: ${JSON.stringify(data)}\n`);
    }
  } catch (err) {
    console.error(`   ✗ Store failed: ${(err as Error).message}\n`);
  }

  // 3. Search it back
  console.log('3. Searching for test memory...');
  try {
    const res = await fetch(`${API_URL}/memories/search`, {
      method: 'GET',
      headers: headers(),
      body: JSON.stringify({
        query: 'smoke test verification',
        user_id: 'smoke_test_user',
        retrieve_method: 'hybrid',
      }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`   ✓ Search returned: ${JSON.stringify(data).slice(0, 200)}...\n`);
    } else {
      console.error(`   ✗ Search failed: ${JSON.stringify(data)}`);
      console.error('   Note: GET-with-body may not work — try POST if this fails.\n');
    }
  } catch (err) {
    console.error(`   ✗ Search failed: ${(err as Error).message}\n`);
  }

  // 4. Search for demo data (if seeded)
  console.log('4. Checking for seeded demo data...');
  try {
    const res = await fetch(`${API_URL}/memories/search`, {
      method: 'GET',
      headers: headers(),
      body: JSON.stringify({
        query: 'transformation arc sovereignty coherence',
        user_id: 'demo_user',
        retrieve_method: 'hybrid',
      }),
    });
    const data = await res.json();
    if (res.ok && data.result) {
      console.log(`   ✓ Demo data found\n`);
    } else {
      console.log(`   ○ No demo data yet — run 'npm run seed' first\n`);
    }
  } catch (err) {
    console.log(`   ○ Demo data check skipped: ${(err as Error).message}\n`);
  }

  console.log('Smoke test complete.');
}

smokeTest();
