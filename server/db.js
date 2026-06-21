import pg from 'pg';
const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : connectionString?.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
});

export default pool;
