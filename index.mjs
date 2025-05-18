import express from 'express';
// import { personalAreaPool } from './database/PersonalArea.database.mjs';

import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './routes/Auth.routes.mjs';
import personalAreaRoutes from './routes/PersonalArea.routes.mjs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';



const app = express();
// const PORT = process.env.PORT || 5001;
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));
// app.options('*', cors(corsOptions), (req, res) => {
//   res.sendStatus(200);
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
}
);

app.use('/auth', authRoutes);
app.use('/personal-area', personalAreaRoutes);

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(PORT);
  console.log(`Server is running on ${PORT}`);
});