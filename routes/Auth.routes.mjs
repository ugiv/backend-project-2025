import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../database/Auth.database.mjs';
import { google } from 'googleapis';
import { uploadPublicImageToGCS, upload } from '../middleware/GoogleStorage.mjs';

dotenv.config();
const router = express.Router();

router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const expireCookies = 4 * 60 * 60 * 1000;
    try {
        const validationData = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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
                const userData = {username: validationData.rows[0].username, account_type: validationData.rows[0].account_type, profile_picture: validationData.rows[0].profile_picture};
                console.log(token);
                res.cookie("jwtToken", token, {
                    httpOnly: true,
                    maxAge: expireCookies,
                    secure: true,
                    sameSite: "None",
                    expire: Date.now() + expireCookies
                });
                res.status(200).json({status: 'ok', data: userData});
            }
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});
router.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    const expireCookies = 50 * 1000;
    const account_type = 'free';
    if (!password || !email || !password){
        res.send('fail signup')
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        pool.query('SELECT email FROM users WHERE email = $1', [email], (err, results) => {
            if (results.rows.length !== 0){
                console.log('fail');
                res.status(200).json({status: 'Email aready exist'});
            } else {
                pool.query('INSERT INTO users(username, email, password, account_type) VALUES($1, $2, $3, $4)', [username, email, hashedPassword, account_type], (err, results) => {
                    if (err){
                        throw err;
                    };
                    const token = jwt.sign({email: email}, 'secret');
                    res.cookie("jwtToken", token, {
                        httpOnly: true,
                        maxAge: expireCookies,
                        secure: true,
                        sameSite: "None",
                        expire: Date.now() - expireCookies
                    });
                    res.status(200).json({status: 'ok'});
                });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


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

router.post('/change-username', async (req, res) => {
    const {username} = req.body;
    const cookiesData = req.cookies;
    if (!cookiesData.jwtToken){
        res.status(500).json({status: 'fail'});
    } else {
        const data = jwt.verify(cookiesData.jwtToken, 'secret');
        if (!data){
            res.status(500).json({status: 'fail'});
        }
        try {
            pool.query('UPDATE users SET username = $1 WHERE id = $2', [username, data.id], (err, results) => {
                if (err){
                    throw err;
                };
                console.log('Username updated');
                res.status(200).json({status: 'ok'});
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/login-status', (req, res) => {
    const cookiesData = req.cookies;
    if (!cookiesData.jwtToken){
        // res.status(500).json({status: 'fail'});
        res.status(200).json({loggedIn: false});
    } else {
        const data = jwt.verify(cookiesData.jwtToken, 'secret');
        if (!data){
            res.status(200).json({loggedIn: false});
        }
        res.status(200).json({loggedIn: true});
    }
});

router.get('/profile-data', async (req, res) => {
    const cookiesData = req.cookies;
    if (!cookiesData.jwtToken){
        res.status(500).json({status: 'fail'});
    } else {
        const data = jwt.verify(cookiesData.jwtToken, 'secret');
        console.log(data);
        if (!data){
            res.status(500).json({status: 'fail'});
        }
        // change table name here
        try {
            pool.query('SELECT profile_picture, username, email, account_type FROM users WHERE id = $1', [data.id], (err, results) => {
                if (err){
                    throw err;
                }
                res.status(200).json({status: 'ok', data: results.rows[0]});
            })
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/change-profile-picture', upload.single('file'), uploadPublicImageToGCS, async (req, res) => {
    const linkImage = req.imageUrl;
    const imageName = req.imageName;
    const cookiesData = req.cookies;
    const profilePictureData = JSON.stringify({link: linkImage, imageName: imageName});
    if (!cookiesData.jwtToken){
        res.status(500).json({status: 'fail'});
    } else {
        const data = jwt.verify(cookiesData.jwtToken, 'secret');
        if (!data){
            res.status(500).json({status: 'fail'});
        }
        // change table name here
        try {
            pool.query('UPDATE users SET profile_picture = $1  WHERE id = $2', [profilePictureData, data.id], (err, results) => {
                if (err){
                    throw err;
                }
                res.status(200).json({status: 'ok'});
            })
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
})


// googleauth 
let urlCallBack = "https://dummy-backend-500141028909.asia-southeast2.run.app/auth/google/callback";

if (process.env.NODE_ENV === 'development'){
    urlCallBack = "http://localhost:5001/auth/google/callback";
}
console.log(urlCallBack);

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    urlCallBack
);

const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
});


router.get('/google', (req, res) => {
    return res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const {code} = req.query;
    const {tokens} = await oauth2Client.getToken(String(code));
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
    });
    oauth2.userinfo.get((err, response) => {
        if (err){
            console.log(err);
        } else {
            const {email, given_name} = response.data;
            const password = '__';
            const expireCookies = 4 * 60 * 60 * 1000;
            const account_type = 'free';
            try {
                // change table name here
                pool.query('SELECT email, id FROM users WHERE email = $1', [email], (err, results) => {
                    if (results.rows.length !== 0){
                        const token = jwt.sign({email: email, id: results.rows[0].id}, 'secret');
                        res.cookie("jwtToken", token, {
                            httpOnly: true,
                            maxAge: expireCookies,
                            secure: true,
                            sameSite: "None",
                            expire: Date.now() - expireCookies
                        });
                        if (process.env.NODE_ENV === 'development'){
                            res.status(200).redirect('http://localhost:3000/dashboard');
                        } else {
                            res.status(200).redirect('https://infork.netlify.app/dashboard');
                        }
                    } else {
                        // change table name here
                        pool.query('INSERT INTO users(username, email, password, account_type) VALUES($1, $2, $3, $4)', [given_name, email, password, account_type], (err, results) => {
                            if (err){
                                throw err;
                            };
                            const token = jwt.sign({email: email}, 'secret');
                            res.cookie("jwtToken", token, {
                                httpOnly: true,
                                maxAge: expireCookies,
                                secure: true,
                                sameSite: "None",
                                expire: Date.now() - expireCookies
                            });
                            if (process.env.NODE_ENV === 'development'){
                                res.status(200).redirect('http://localhost:3000/dashboard');
                            } else {
                                res.status(200).redirect('https://infork.netlify.app/dashboard');
                            }
                        });
                    }
                });
            } catch (error) {
                console.log(error);
            }
        }
    });
});

router.get('/forgot-password', (req, res) => {
  res.send('Forgot Password Page');
}
);
router.get('/reset-password', (req, res) => {
  res.send('Reset Password Page');
}
);
router.get('/verify-email', (req, res) => {
  res.send('Verify Email Page');
}
);
router.get('/verify-phone', (req, res) => {
  res.send('Verify Phone Page');
}
);
router.get('/change-password', (req, res) => {
  res.send('Change Password Page');
}
);

export default router;