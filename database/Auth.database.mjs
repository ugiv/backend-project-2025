import pkg from 'pg';
const { Pool } = pkg;
import { Connector } from '@google-cloud/cloud-sql-connector';
// import dotenv from 'dotenv';
// dotenv.config();
// import pkg from 'pg';
// const { Pool } = pkg;

// export const pool = new Pool({
//   user: 'postgres',
//   password: process.env.DB_PASSWORD,
//   host: 'localhost',
//   port: 5432, // default Postgres port
//   database: 'account_data'
// });

const connector = new Connector();
const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
    authType: 'IAM'
});

export const pool = new Pool({
    ...clientOpts,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
});

