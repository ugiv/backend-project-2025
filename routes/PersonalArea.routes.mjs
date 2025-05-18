// import { pool } from '../database/PersonalArea.database.js';
import { pool } from '../database/Auth.database.mjs';
import express from 'express';
import jwt from 'jsonwebtoken';
const router = express.Router();
// import multer from "multer";
// import { Storage } from "@google-cloud/storage";
import { upload, uploadImageToGCS } from '../middleware/GoogleStorage.mjs';

router.post('/template-editor/add-new-collection', (req, res) => {
    const cookiesData = req.cookies;
    if (cookiesData){
        const data = jwt.verify(cookiesData.jwtToken, 'secret');
        const {id, template_id, name, link, components_list, style, content, image} = req.body;
        const current_time = '2025-03-11';
        try {
            pool.query('INSERT INTO website_list(id, user_id, template_id, name, link, components_list, style, content, created_at) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)', [id, data.id, template_id, name, link, components_list, style, content, current_time], (error, results) => {
                if (error){
                    throw error;
                };
            });
            pool.query('INSERT INTO collection_data(web_id, user_id, image) VALUES($1, $2, $3)', [id, data.id, image], (error, results) => {
                if (error){
                    throw error;
                };
            })
            res.status(200).json({status: 'ok'})
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/template-editor/save', async (req, res) => {
    const cookiesData = req.cookies
    if (cookiesData){
        // const data = jwt.verify(cookiesData.jwtToken, 'secret');
        const {name, id, components_list, style, content} = req.body;
        // const current_time = '2025-03-11';
        try {
            pool.query('UPDATE website_list SET name = $1, components_list = $2, style = $3, content = $4 WHERE id = $5 ', [name, components_list, style, content, id], (error, results) => {
                if (error){
                    throw error;
                }
                res.status(200).json({status: 'ok'})
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.get('/website-list/:link', async (req, res) => {
    const link = req.params.link;
    const ip_address = req.ip;
    try {
        pool.query('SELECT id, template_id, name, link, components_list, content, style FROM website_list WHERE link = $1', [link], (err, results) => {
            if (err){
                throw err;
            }
            if (results.rows.length !== 0){
                pool.query('INSERT INTO visitor_data(web_id, ip_address, visit_time) VALUES($1, $2, current_timestamp)', [results.rows[0].id, ip_address], (error, results) => {
                    if (error){
                        throw error;
                    };
                    console.log('add visitor');
                });
                res.json(results.rows);
            }
        });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/edit-website/:web_id', async (req, res) => {
    const web_id = req.params.web_id;
    try {
        pool.query(
            `SELECT website_list.id, website_list.template_id, website_list.name, website_list.link, 
            website_list.components_list, website_list.content, website_list.style, collection_data.image_link, collection_data.image_name 
            FROM website_list
            INNER JOIN collection_data ON website_list.id = collection_data.web_id 
            WHERE website_list.id = $1`, 
            [web_id], (err, results) => {
            if (err){
                throw err;
            }
            res.json(results.rows[0]);
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/collection', (req, res) => {
    const cookiesData = req.cookies;
    if (Object.values(cookiesData).length === 0){
        res.status(400).json({status: 'fail'})
    } else {
        try {
            const data = jwt.verify(cookiesData.jwtToken, 'secret');
            pool.query('SELECT web_id, image_link, image_name, visitor, name, link, template_id FROM collection_data INNER JOIN website_list ON collection_data.web_id = website_list.id AND website_list.user_id = $1', [data.id], (error, results) => {
                if (error){
                    throw error;
                };
                res.status(200).json({status: 'ok', data: results.rows});
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/change-link', (req, res) => {
    const cookiesData = req.cookies;
    const {link, web_id} = req.body;
    if (Object.values(cookiesData).length === 0){
        res.status(400).json({status: 'fail'})
    } else {
        try {
            // const data = jwt.verify(cookiesData.jwtToken, 'secret');
            pool.query('UPDATE website_list SET link = $1 WHERE id = $2', [link, web_id], (error, results) => {
                if (error){
                    throw error;
                };
                console.log('change link')
                res.status(200).json({status: 'ok', data: results.rows});
            })
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});
router.post('/add-visitor', (req, res) => {
    const ip_address = req.ip;
    const {web_id} = req.body;
    // const time = Date.now().toString();
    // try {
    //     pool.query('INSERT INTO visitor_data(web_id, ip_address, visit_time) VALUES($1, $2, current_timestamp)', [web_id, ip_address], (error, results) => {
    //         if (error){
    //             throw error;
    //         };
    //         console.log('add visitor')
    //         res.status(200).json({status: 'ok'});
    //     });
    // } catch (error) {
    //     throw error;
    // }
    res.status(200).json({status: 'ok'});
});

// router.post('/analytics', (req, res) => {
//     const cookiesData = req.cookies;
//     const {web_id} = req.body;
//     console.log(web_id);
//     if (Object.values(cookiesData).length === 0){
//         res.status(400).json({status: 'fail'});
//     } else {
//         try {
//             // const data = jwt.verify(cookiesData.jwtToken, 'secret');
//             pool.query(
//                 `SELECT TO_CHAR(visit_time, 'Month') AS month_name, COUNT(*) AS total_visitors FROM visitor_data WHERE web_id = $1 GROUP BY month_name ORDER BY MIN(visit_time)`, 
//                 [web_id], (err, results) => {
//                 if (err) {
//                     throw err;
//                 }
//                 const monthly = results.rows;
//                 pool.query(
//                     `
//                     SELECT 
//                         DATE_PART('year', visit_time) AS Year,
//                         TO_CHAR(visit_time, 'Month') AS Month,
//                         EXTRACT(DAY FROM visit_time) AS day,
//                         COUNT(*) AS total_daily
//                     FROM 
//                         visitor_data
//                     WHERE web_id = $1
//                     GROUP BY 
//                         Year, Month, Day
//                     ORDER BY 
//                         Year, Month, Day
//                     `, [web_id], (err, results) => {
//                     if (err) {
//                         throw err;
//                     }
//                     if (monthly && results.rows){
//                         console.log(results.rows);
//                         res.status(200).json({status: 'ok', data: {daily: results.rows, monthly: monthly}});
//                     } else {
//                         res.status(400).json({status: 'fail'});
//                     }
//                 });
//             });
//         } catch (error) {
//             res.status(500).json({ error: 'Internal server error' });
//         }
//     }
// });


// upload image to google cloud storage


// const storage = new Storage({
//     keyFilename: 'project-key.json'
// });
// const bucket = storage.bucket('pagetos-image-storage');
// const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: {
//         fileSize: 5 * 1024 * 1024
//     }
// });

// const uploadImage = (file) => {
//     return new Promise((resolve, reject) => {
//         if (!file){
//             reject('No image file');
//         }
//         const {originalname, buffer} = file;
//         const blob = bucket.file(originalname);
//         const blobStream = blob.createWriteStream({
//             resumable: false
//         });
//         blobStream.on('finish', () => {
//             const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
//             resolve(publicUrl);
//         }).on('error', (error) => {
//             reject(error);
//         }).end(buffer);
//     });
// }

// const uploadNewImageToGCS = async (req, res, next) => {
//     const file = req.file;
//     const webData = req.body.templateData;
//     const {image} = JSON.parse(webData);
//     if (image){
//         console.log(image);
//         await storage.bucket('pagetos-image-storage').file(image).delete();
//         console.log('delete');
//     }
//     if (!file){
//         res.status(400).json({status: 'fail', message: 'No image file'});
//     }
//     let fileName;
//     fileName = Date.now() + file.originalname;
//     const blob = bucket.file(fileName);
//     const blobStream = blob.createWriteStream({
//         metadata: {
//             contentType: file.mimetype
//         }
//     });
//     blobStream.on('error', (error) => {
//         console.log('fail');
//         res.status(500).json({status: 'fail', message: error});
//     });
//     blobStream.on('finish', () => {
//         const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
//         console.log(publicUrl);
//         req.imageUrl = publicUrl;
//         req.imageName = fileName;
//         next();
//     });
//     blobStream.end(file.buffer);
// }

router.post('/upload-last-edit-image', upload.single('file'), uploadImageToGCS, async (req, res, next) => {
    const linkImage = req.imageUrl;
    const imageName = req.imageName;
    const cookiesData = req.cookies;
    const data = req.body.templateData;
    const {id, template_id, name, link, components_list, style, content} = JSON.parse(data);
    if (cookiesData){
        const jwtData = jwt.verify(cookiesData.jwtToken, 'secret');
        const current_time = '2025-03-11';
        if (link === undefined){
            try {
                pool.query('UPDATE website_list SET name = $1, components_list = $2, style = $3, content = $4 WHERE id = $5 ', [name, components_list, style, content, id], (error, results) => {
                    if (error){
                        throw error;
                    }
                });
                pool.query('UPDATE collection_data SET image_link = $1, image_name = $2 WHERE web_id = $3 ', [linkImage, imageName, id], (error, results) => {
                    if (error){
                        throw error;
                    }
                });
                res.status(200).json({status: 'ok'})
            } catch (error) {
                res.status(500).json({ error: 'Internal server error' });
            }
        } else {
            try {
                pool.query('INSERT INTO website_list(id, user_id, template_id, name, link, components_list, style, content, created_at) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)', [id, jwtData.id, template_id, name, link, components_list, style, content, current_time], (error, results) => {
                    if (error){
                        throw error;
                    };
                });
                pool.query('INSERT INTO collection_data(web_id, user_id, image_link, image_name) VALUES($1, $2, $3, $4)', [id, jwtData.id, linkImage, imageName], (error, results) => {
                    if (error){
                        throw error;
                    };
                })
                res.status(200).json({status: 'ok'})
            } catch (error) {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    } else {
        res.status(400).json({status: 'fail'});
    }
    next();
});

export default router;