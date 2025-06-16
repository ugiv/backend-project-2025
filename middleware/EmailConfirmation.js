
import { pool } from '../database/Auth.database.mjs';
// services/emailService.js
import sgMail from '@sendgrid/mail';

// this code is not complete, please complete it


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const generateUniqueToken = () => {
  // Implement your logic to generate a unique token
  return Math.random().toString(36).substring(2, 15);
}

// this function sends a confirmation email to the user after registration
const sendConfirmationEmail = async (email, token) => {
  const link = `https://yourdomain.com/confirm?token=${token}`;
  const msg = {
    to: email,
    from: 'no-reply@yourdomain.com',
    subject: 'Please confirm your email',
    html: `<p>Click <a href="${link}">here</a> to confirm your email address.</p>`,
  };
  await sgMail.send(msg);
};

// this function registers a user and sends a confirmation email
// it must change into router in auth.routes.mjs post request

const registerUser = async (req, res) => {
    const { email, password } = req.body;
  
    // Save user and generate token
    const token = generateUniqueToken(); // your logic
    await pool.query('INSERT INTO users (email, password, confirmation_token) VALUES ($1, $2, $3)', [email, password, token]);
  
    // Send confirmation
    await sendConfirmationEmail(email, token);

    res.status(200).json({ message: 'Registration successful! Check your email to confirm.' });
};

const confirmEmail = async (req, res) => {
    const { token } = req.query;
    const user = await pool.query('SELECT * FROM users WHERE confirmation_token = $1', [token]);
  
    if (!user) {
      return res.status(400).send('Invalid or expired token');
    }
  
    await pool.query('UPDATE users SET is_confirmed = true WHERE confirmation_token = $1', [token]);
    res.send('Email confirmed!');
};

module.exports = { sendConfirmationEmail, registerUser, confirmEmail };
