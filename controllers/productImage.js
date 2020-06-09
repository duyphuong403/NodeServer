import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/public/images/uploads/products');
    },
    // By default, multer removes file extensions so let's add them back
    filename: (req, file, cb) => {
        console.log('filename: ' + file.fieldname + '-' + Date.now() + path.extname(file.originalname))
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload_image = async (req, res) => {
    try {
        const upload = multer({
            storage: storage,
            limits: { fieldSize: 2 * 1024 * 1024 },
            fileFilter: imageFilter
        }).single('file');
        // .array('files', 10);

        upload(req, res, (err) => {
            console.log(req.file)
            if (req.fileValidationError) {
                return res.status(403).json({
                    result: 'failed',
                    message: req.fileValidationError
                });
            } else if (!req.file) {
                return res.status(403).json({
                    result: 'failed',
                    message: 'Please select an image to upload'
                })
            } else if (err instanceof multer.MulterError) {
                return res.status(403).json({
                    result: 'failed',
                    message: err
                });
            }
            else if (err) {
                return res.json({
                    result: 'failed',
                    message: err
                });
            }

            return res.json({
                result: 'ok',
                message: `Upload image successfully`
            })
        })
    } catch (error) {
        return res.status(500).json({
            result: 'failed',
            message: `Error upload image. ${error}`
        })
    }
}

export { upload_image }; 