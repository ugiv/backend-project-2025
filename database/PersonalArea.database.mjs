// import dotenv from 'dotenv';
// dotenv.config();
// import pkg from 'pg';
// const { Pool } = pkg;
// import { Connector } from '@google-cloud/cloud-sql-connector';

import pkg from 'pg';
const { Pool } = pkg;
import { Connector } from '@google-cloud/cloud-sql-connector';
import dotenv from 'dotenv';
dotenv.config();

export let pool; 
if (process.env.NODE_ENV === 'production') {
    const connector = new Connector();
    const clientOpts = await connector.getOptions({
        instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
        authType: 'IAM'
    });
    pool = new Pool({
        ...clientOpts,
        user: process.env.DB_USER,
        database: process.env.DB_NAME
    });
}
if (process.env.NODE_ENV === 'development') {
     pool = new Pool({
        user: 'postgres',
        password: process.env.DB_PASSWORD,
        host: 'localhost',
        port: 5432, // default Postgres port
        database: 'website_data'
    });
}



// const connector = new Connector();
// const clientOpts = await connector.getOptions({
//     instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
//     authType: 'IAM'
// });

// export const pool = new Pool({
//     ...clientOpts,
//     user: process.env.DB_USER,
//     database: process.env.DB_NAME
// });