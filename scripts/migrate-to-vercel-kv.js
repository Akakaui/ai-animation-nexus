const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

const KV_KEY = 'nexus_db';

async function main() {
  const jsonPath = path.join(__dirname, '..', 'data', 'nexus.json');

  if (!fs.existsSync(jsonPath)) {
    console.log('No existing data file found. Nothing to migrate.');
    return;
  }

  const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const currentKv = await kv.get(KV_KEY);
  if (currentKv && currentKv.students && currentKv.students.length > 0) {
    console.log(`Vercel KV already has ${currentKv.students.length} students. Skipping migration.`);
    return;
  }

  if (!existingData.students || existingData.students.length === 0) {
    console.log('No students in existing data. Nothing to migrate.');
    return;
  }

  await kv.set(KV_KEY, existingData);
  console.log(`Migrated ${existingData.students.length} students, ${existingData.sessions.length} sessions, ${existingData.attendance.length} attendance records to Vercel KV.`);
}

main().catch(console.error);
