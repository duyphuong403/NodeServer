import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/images/uploads/products/");
    },
    // filename: (req, file, cb) => {
    //     cb(null, `${file.fieldname}_${req.user._username}.jpg`);
    // }
});

const upload = multer({
    storage,    
    limits: {fileSize: 2 * 1024 * 1024}, // 2MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/pjpeg', 'image/png'];
        if (!allowedMimes.includes(file.mimetype)) {
            req.error = 'Only images are allowed'
            return cb(null, false, new Error("Only images are allowed"));
        }
        cb(null, true);
    }
});

export default upload