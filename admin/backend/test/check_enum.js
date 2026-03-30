const { Client } = require('pg');
const { env } = require('../src/config/env');

const client = new Client({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkEnum() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_rooms_status';
    `);
    console.log('Enum values for enum_rooms_status:', res.rows.map(r => r.enumlabel));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

checkEnum();
