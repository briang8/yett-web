const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || process.env.PG_DATABASE_URL;

if (!connectionString) {
    console.warn('Postgres DATABASE_URL not set. DB functions will fail until configured.');
}

const pool = new Pool({ connectionString });

module.exports = {
    query: async (text, params) => {
        const res = await pool.query(text, params);
        return res.rows;
    },
    pool
};
