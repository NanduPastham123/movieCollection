const { Pool } = require('pg');
require('dotenv').config();

//connecting postgresql database with URL string 
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;