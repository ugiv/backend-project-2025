import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {pool} from '../database/Auth.database.js';

dotenv.config();
const router = express.Router();

router.post('/login', async (req, res) => {
    console.log('Login');
    const {email, password} = req.body;
    console.log(email, password);
    const expireCookies = 4 * 60 * 60 * 1000;
    try {
        const validationData = await pool.query('SELECT * FROM user_data WHERE email = $1', [email]);
        if (validationData.rows.length === 0 || validationData.rows === false){
            res.status(400).json({status: 'Email not exist.'});
        } else {
            const passwordHash = validationData.rows[0].password;
            const passwordMatch = await bcrypt.compare(password, passwordHash);
            if (!passwordMatch) {
                console.log('fail');
                res.status(200).json({status: 'Password is wrong'});
            } else {
                const token = jwt.sign({email: validationData.rows[0].email, id: validationData.rows[0].id}, 'secret')
                res.cookie("jwtToken", token, {
                    httpOnly: true,
                    maxAge: expireCookies,
                    expire: Date.now() + expireCookies
                });
                res.status(200).json({status: 'ok'});
            }
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}
);
router.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    const expireCookies = 50 * 1000;
    if (!password || !email || !password){
        res.send('fail signup')
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        pool.query('SELECT email FROM user_data WHERE email = $1', [email], (err, results) => {
            if (results.rows.length !== 0){
                console.log('fail');
                res.status(200).json({status: 'Email aready exist'});
            } else {
                pool.query('INSERT INTO user_data(username, email, password) VALUES($1, $2, $3)', [username, email, hashedPassword], (err, results) => {
                    if (err){
                        throw err;
                    };
                    const token = jwt.sign({email: email}, 'secret');
                    res.cookie("jwtToken", token, {
                        httpOnly: true,
                        maxAge: expireCookies,
                        expire: Date.now() - expireCookies
                    });
                    res.status(200).json({status: 'ok'});
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}
);
router.get('/logout', (req, res) => {
    const cookiesData = req.cookies;
    if (cookiesData){
        res.clearCookie("jwtToken");
        res.status(200).json({status: 'ok'});

    } else {
        res.send(200).json({status: 'fail'})
    }
}
);

// router.get('/forgot-password', (req, res) => {
//   res.send('Forgot Password Page');
// }
// );
// router.get('/reset-password', (req, res) => {
//   res.send('Reset Password Page');
// }
// );
// router.get('/verify-email', (req, res) => {
//   res.send('Verify Email Page');
// }
// );
// router.get('/verify-phone', (req, res) => {
//   res.send('Verify Phone Page');
// }
// );
// router.get('/change-password', (req, res) => {
//   res.send('Change Password Page');
// }
// );

export default router;