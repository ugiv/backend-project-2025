import multer from "multer";
import { Storage } from "@google-cloud/storage";
import jwt from 'jsonwebtoken';
import { pool } from "../database/Auth.database.mjs";

const storage = new Storage({
    keyFilename: 'project-key.json'
});
const bucket = storage.bucket('pagetos-image-storage');
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

export const uploadImageToGCS = async (req, res, next) => {
    const file = req.file;
    const webData = req.body.templateData;
    console.log(file);
    if (webData){
        const {image} = JSON.parse(webData);
        console.log(image);
        if (image !== undefined && image !== false && image!== ''){
            // console.log(image);
            await storage.bucket('pagetos-image-storage').file(image).delete();
            // console.log('delete');
        } 
    }
    if (!file){
        res.status(400).json({status: 'fail', message: 'No image file'});
    }
    let fileName;
    fileName = Date.now() + file.originalname;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: file.mimetype
        }
    });
    blobStream.on('error', (error) => {
        console.log('fail');
        res.status(500).json({status: 'fail', message: error});
    });
    blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        console.log(publicUrl);
        req.imageUrl = publicUrl;
        req.imageName = fileName;
        next();
    });
    blobStream.end(file.buffer);
}

export const uploadPublicImageToGCS = async (req, res, next) => {
    const file = req.file;
    let imageName = false;
    const cookiesData = req.cookies;
    const data = jwt.verify(cookiesData.jwtToken, 'secret');
    try {
        pool.query("SELECT profile_picture FROM users WHERE id = $1", [data.id], (err, results) => {
            if (err){
                throw err;
            }
            imageName = results.rows[0].profile_picture;
            if (imageName && imageName !== null){
                storage.bucket('pagetos-image-storage').file(imageName.imageName).delete();
            }
            if (!file){
                res.status(400).json({status: 'fail', message: 'No image file'});
            }
            let fileName;
            fileName = Date.now() + file.originalname;
            const blob = bucket.file(fileName);
            const blobStream = blob.createWriteStream({
                metadata: {
                    contentType: file.mimetype
                }
            });
            blobStream.on('error', (error) => {
                console.log('fail');
                res.status(500).json({status: 'fail', message: error});
            });
            blobStream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                console.log(publicUrl);
                req.imageUrl = publicUrl;
                req.imageName = fileName;
                next();
            });
            blobStream.end(file.buffer);
        })
    } catch (error) {
        throw error;
    }
}

export const uploadCollectionImageToGCS = async (req, res, next) => {
    const file = req.file;
    const cookiesData = req.cookies;
    const data = jwt.verify(cookiesData.jwtToken, 'secret');
    try {
        if (file === undefined || file === null || file === ''){
            res.status(400).json({status: 'fail', message: 'No image file'});
        }
        let fileName;
        fileName = 'collection-image-' + data.id + '-'+ Date.now();
        const blob = bucket.file(fileName);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
        });
        blobStream.on('error', (error) => {
            console.log('fail');
            res.status(500).json({status: 'fail', message: error});
        });
        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            req.imageUrl = publicUrl;
            req.imageName = fileName;
            next();
        });
        blobStream.end(file.buffer);
    } catch (error) {
        throw error;
    }
}