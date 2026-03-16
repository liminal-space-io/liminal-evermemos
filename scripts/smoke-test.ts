/**
 * Smoke Test — verify EverMemOS is reachable, can store, and can search.
 *
 * Usage: npm run smoke-test
 * Requires: EVERMIND_API_URL and EVERMIND_API_KEY in .env.local
 */

import 'dotenv/config';

const API_URL = process.env.EVERMIND_API_URL ?? 'https://api.evermind.ai/api/v0';
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
    const healthUrl = API_URL.replace(/\/api\/v\d+$/, '') + '/health';
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

  // 3. Search it back (use POST — GET-with-body is silently ignored by fetch)
  console.log('3. Searching for test memory...');
  try {
    const searchParams = {
      query: 'smoke test verification',
      group_id: 'user-smoke_test_user',
      retrieve_method: 'hybrid',
      limit: 5,
    };

    // Try POST first (Evermind Cloud API may prefer POST for search)
    let res = await fetch(`${API_URL}/memories/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(searchParams),
    });

    // Fallback to GET with query params if POST returns 405
    if (res.status === 405) {
      const qs = new URLSearchParams({
        query: searchParams.query,
        group_id: searchParams.group_id,
        retrieve_method: searchParams.retrieve_method,
        limit: String(searchParams.limit),
      });
      res = await fetch(`${API_URL}/memories/search?${qs}`, {
        method: 'GET',
        headers: headers(),
      });
    }

    const data = await res.json();
    if (res.ok) {
      console.log(`   ✓ Search returned: ${JSON.stringify(data).slice(0, 200)}...\n`);
    } else {
      console.error(`   ✗ Search failed (${res.status}): ${JSON.stringify(data)}\n`);
    }
  } catch (err) {
    console.error(`   ✗ Search failed: ${(err as Error).message}\n`);
  }

  // 4. Search for demo data (if seeded)
  console.log('4. Checking for seeded demo data...');
  try {
    const demoParams = {
      query: 'transformation arc sovereignty coherence',
      group_id: 'user-demo_user',
      retrieve_method: 'hybrid',
      limit: 5,
    };

    let res = await fetch(`${API_URL}/memories/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(demoParams),
    });

    // Fallback to GET with query params if POST returns 405
    if (res.status === 405) {
      const qs = new URLSearchParams({
        query: demoParams.query,
        group_id: demoParams.group_id,
        retrieve_method: demoParams.retrieve_method,
        limit: String(demoParams.limit),
      });
      res = await fetch(`${API_URL}/memories/search?${qs}`, {
        method: 'GET',
        headers: headers(),
      });
    }

    const data = await res.json();
    const results = data.memories ?? data.results ?? data ?? [];
    if (res.ok && Array.isArray(results) && results.length > 0) {
      console.log(`   ✓ Demo data found (${results.length} results)\n`);
    } else {
      console.log(`   ○ No demo data yet — run 'npm run seed' first\n`);
    }
  } catch (err) {
    console.log(`   ○ Demo data check skipped: ${(err as Error).message}\n`);
  }

  console.log('Smoke test complete.');
}

smokeTest();
