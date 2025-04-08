// import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  host: 'localhost',
  port: 5432, // default Postgres port
  database: 'account_data'
});
