import express from 'express';
const router = express.Router();
import { upload_image } from '../controllers/productImage';
import upload from '../middlewares/upload_images';
// import { check } from 'express-validator';

router.post('/upload', upload.single('file'), (req,res) => {
    if (req.fileValidationError) {
        return res.send(req.fileValidationError);
    }
    else if (!req.file) {
        return res.send('Please select an image to upload');
    }
    else if (err instanceof multer.MulterError) {
        return res.send(err);
    }
    else if (err) {
        return res.send(err);
    }
})

export default router;