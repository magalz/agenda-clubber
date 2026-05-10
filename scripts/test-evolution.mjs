#!/usr/bin/env node

/**
 * test-evolution.mjs
 *
 * Integration test for Evolution API WhatsApp setup.
 * Requires a running Evolution API instance (see docker-compose.evolution.yml).
 *
 * Usage:
 *   node scripts/test-evolution.mjs
 *
 * Environment variables (from .env.local):
 *   EVOLUTION_API_URL=http://localhost:8080
 *   EVOLUTION_API_KEY=<your-api-key>
 *   EVOLUTION_ADMIN_GROUP_ID=<group-jid>
 */

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY = process.env.EVOLUTION_API_KEY;
const ADMIN_GROUP_ID = process.env.EVOLUTION_ADMIN_GROUP_ID;

const INSTANCE_NAME = 'agenda-clubber-admin';

async function main() {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('  Evolution API — Integration Test');
    console.log('═══════════════════════════════════════════════');
    console.log('');

    if (!BASE_URL || !API_KEY || !ADMIN_GROUP_ID) {
        console.error('  ❌ Missing env vars. Set EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_ADMIN_GROUP_ID');
        process.exit(1);
    }

    console.log(`  URL:     ${BASE_URL}`);
    console.log(`  Group:   ${ADMIN_GROUP_ID}`);
    console.log('');

    // Step 1: Create instance (idempotent)
    console.log('  1. Creating instance...');
    const createRes = await fetch(`${BASE_URL}/instance/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: API_KEY },
        body: JSON.stringify({ instanceName: INSTANCE_NAME, qrcode: false, number: '' }),
    });
    if (!createRes.ok && createRes.status !== 409 && createRes.status !== 403) { // 409/403 = already exists
        const text = await createRes.text();
        console.error(`  ❌ Instance creation failed: ${createRes.status} ${text}`);
        process.exit(1);
    }
    console.log('  ✅ Instance ready');

    // Step 2: Send a test message
    console.log('  2. Sending test message...');
    const sendRes = await fetch(`${BASE_URL}/message/sendText/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: API_KEY },
        body: JSON.stringify({
            number: ADMIN_GROUP_ID,
            options: { delay: 1200, presence: 'composing' },
            text: '🔧 Teste da Agenda Clubber — Evolution API configurada com sucesso!',
        }),
    });
    if (!sendRes.ok) {
        const text = await sendRes.text();
        console.error(`  ❌ Send message failed: ${sendRes.status} ${text}`);
        process.exit(1);
    }
    console.log('  ✅ Test message sent!');

    // Step 3: Generate group deep link
    console.log('  3. Deep link:');
    const groupName = ADMIN_GROUP_ID.replace('@g.us', '');
    console.log(`     https://wa.me/${groupName}?text=Agenda%20Clubber%20-%20Admin`);
    console.log('');

    console.log('  ✅ All checks passed!');
    console.log('');
}

main().catch((err) => {
    console.error('  ❌ Unexpected error:', err);
    process.exit(1);
});
