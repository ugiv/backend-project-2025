import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import authRoutes from './routes/Auth.routes.js';
import personalAreaRoutes from './routes/PersonalArea.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
}
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/personal-area', personalAreaRoutes);

app.listen(PORT, () => {
  console.log(PORT);
  console.log(`Server is running on http://localhost:${PORT}`);
});