import User from '../models/User';
import { Op } from 'sequelize';
import { get_redis, set_redis } from '../middlewares/redis';
import { validationResult, check } from 'express-validator';
import { isEmpty, isLength, isBoolean, isNumeric, isInt, isEmail, toDate } from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import verifyUserId from '../middlewares/verifyUserId'
import { upload } from '../middlewares/upload_images';

// Find
const find_user = async (req, res) => {
    try {
        // check role
        const { _username, _role } = req.user;
        if (_role !== 2) {
            return res.status(403).json({
                result: 'ok',
                data: {},
                message: 'Sorry, you do not permit access to here'
            })
        }


        const search = req.query.search || "";
        const search_by = req.query.searchby || "username";
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const offset = (page - 1) * limit;

        const redis_key = `user-search${search}-searchby${search_by}-page${page}-limit${limit}`;

        const user_cache = await get_redis(redis_key);
        if (user_cache !== undefined && user_cache !== null && !isEmpty(user_cache)) {
            return res.json({
                result: 'ok',
                data: JSON.parse(user_cache),
                message: 'Get User successfully'
            });
        }

        let user = {};
        let all_User = {};
        let whereClause = {};
        if (!isEmpty(search)) {
            if (!isLength(search, { min: 0, max: 100 })) {
                return res.status(400).json({
                    result: 'failed',
                    data: {},
                    message: 'The Search must be less than 100 chars'
                });
            }
            // assign to where clause
            switch (search_by.toLowerCase()) {
                case 'username':
                    whereClause = {
                        username: {
                            [Op.like]: '%' + search.toLowerCase() + '%'
                        }
                    }
                    break;
                case 'fullname':
                    whereClause = {
                        fullname: {
                            [Op.like]: '%' + search.toLowerCase() + '%'
                        }
                    }
                    break;
                // TODO: create more search by...
                default:
                    whereClause = {
                        username: {
                            [Op.like]: '%' + search.toLowerCase() + '%'
                        }
                    }
                    break;
            }
            // get all rows
            all_User = await User.findAll({
                attributes: { exclude: ['password'] },
                where: whereClause
            });

            // get row with limit
            user = await User.findAll({
                attributes: { exclude: ['password'] },
                limit,
                offset,
                order: [['username', 'ASC']],
                where: whereClause
            })
        } else {
            // get all
            all_User = await User.findAll({
                attributes: { exclude: ['password'] },
            });

            user = await User.findAll({
                attributes: { exclude: ['password'] },
                limit,
                offset,
                order: [['username', 'ASC']],
            });
        }

        if (all_User.length <= 0) {
            res.json({
                result: 'ok',
                data: [],
                message: `Not found any User with search = ${search} & search by = ${search_by}`
            })
            return;
        }
        // check req.page > total page in data
        console.log(`${Math.ceil(all_User.length / limit)}`);

        if (page > Math.ceil(all_User.length / limit)) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: 'Page cannot greater than total Page'
            })
            return;
        }
        set_redis(`user-search${search}-searchby${search_by}-page${page}-limit${limit}`, 3600, user);

        res.json({
            result: 'ok',
            data: user,
            rows: all_User.length,
            pages: Math.ceil(all_User.length / limit)
        })
    } catch (error) {
        res.status(500).json({
            result: 'failed',
            message: `Get User failed. ${error}`
        })
    }
}

// Insert
const register_user = async (req, res) => {
    try {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(422).json({ err: err.array() });
        }

        // validate
        let { username, password, fullname, email, phone, dob } = req.body;

        username = username.toLowerCase();

        if (username.includes('admin')) {
            return res.status(422).json({
                result: 'failed',
                message: `Username can not contain 'admin'`
            })
        }

        // check user exists
        let curUser = await User.findAll({
            attributes: {
                exclude: ['password']
            },
            where: {
                username
            }
        })
        if (curUser.length > 0) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: `Username was already exists.`
            })
            return;
        }

        if (fullname !== undefined && !isLength(fullname, { min: 0, max: 255 })) {
            fullname = fullname.toLowerCase().trim();
            if (fullname.includes('admin')) {
                return res.status(422).json({
                    result: 'failed',
                    message: `Username can not contain 'admin'`
                })
            }
            // check fullname exists
            let curFullname = await User.findAll({
                attributes: {
                    exclude: ['password']
                },
                where: {
                    fullname
                }
            })
            if (curFullname.length > 0) {
                return res.status(400).json({
                    result: 'failed',
                    data: {},
                    message: `Fullname was already exists`
                })
            }

            return res.status(400).json({
                result: 'failed',
                data: {},
                message: 'fullname can not longer than 255 letters'
            });
        }

        if (email !== undefined && isEmail(email)) {
            email = email.toLowerCase().trim();
            // check email exists
            let checkEmail = await User.findAll({
                attributes: {
                    exclude: ['password']
                },
                where: {
                    email
                }
            })
            if (checkEmail.length > 0) {
                return res.status(400).json({
                    result: 'failed',
                    data: {},
                    message: `Email was already exists`
                })
            }
        }

        if (phone !== undefined) {
            phone = phone.replace(/\s/g, '');
            if (!isLength(phone, { min: 10, max: 12 })) {
                return res.status(400).json({
                    result: 'failed',
                    data: {},
                    message: 'Phone must be from 10 - 12 numbers.'
                });
            }
        }

        if (dob === undefined || !toDate(dob) || toDate(dob) > Date.now() || Math.abs(Date.now() - toDate(dob)) < 16 * 365 * 24 * 60 * 60 * 1000) {
            return res.status(400).json({
                result: 'failed',
                data: {},
                message: 'Dob can not be empty, must be in format yyyy-mm-dd/dd-mm-yyyy, must be greater than the current Date and your year old smaller than 16.'
            });
        }

        dob = toDate(dob);

        let salt = await bcrypt.genSalt();
        password = await bcrypt.hash(password, salt);

        let newUser = await User.create({
            username, password, fullname, email, phone, dob
        }, {
            fields: ['username', 'password', 'fullname', 'email', 'phone', 'dob']
        })
        delete newUser['password'];
        if (newUser) {
            res.json({
                result: 'ok',
                data: newUser,
                message: 'Insert a new User successfully'
            })
        } else {
            res.status(500).json({
                result: 'failed',
                data: {},
                message: 'Insert a new User failed'
            })
        }
    } catch (error) {
        res.status(400).json({
            result: 'failed',
            data: {},
            message: `Create a new user failed. ${error}`
        })
    }
}

// Login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const curUser = await User.findAll({
            attributes: ['id', 'username', 'password', 'role'],
            where: {
                username
            },
            raw: true
        })
        if (curUser.length <= 0) {
            return res.status(400).json({
                result: 'failed',
                data: {},
                message: `Not found any User with username: '${username}'`
            })
        }
        const validPass = await bcrypt.compare(password, curUser[0].password);
        if (!validPass) {
            return res.status(400).json({
                result: 'failed',
                data: {},
                message: `Password invalid`
            })
        }
        const token = jwt.sign({ _id: curUser[0].id, _username: curUser[0].username, _role: curUser[0].role },
            process.env.TOKEN_SECRET,
            { expiresIn: '1d' });
        return res.header('authToken', token).json({
            result: 'ok',
            data: {
                authToken: token
            },
            message: `Login successfully`
        });

    } catch (error) {
        res.status(400).json({
            result: 'failed',
            data: {},
            message: `Login failed. ${error}`
        })
    }
}

// Update
const update_user = async (req, res) => {
    try {
        let { id } = req.params;
        id = id.trim();
        if (!id || id === undefined || isEmpty(id) || !isNumeric(id)) {
            return res.status(400).json({
                result: 'failed',
                message: 'Id cannot empty and must be a number'
            })
        }

        // Find user by id
        const curUser = await verifyUserId(id);
        if (curUser == 0) {
            return res.status(400).json({
                result: 'failed',
                message: `Not found any User with id = ${id}`
            })
        }

        // Check match id
        if (req.user._id != curUser[0].id) {
            return res.status(400).json({
                result: 'failed',
                message: `You only can edit your own account information`
            })
        }

        // Validation result
        const err = validationResult(req);
        if (!err.isEmpty()) {
            return res.status(422).json({
                result: 'failed',
                message: err.array()
            });
        }

        // Validate
        let { fullname, email, phone, dob } = req.body;
        if (!fullname && !email && !phone && !dob) {
            return res.status(400).json({
                result: 'failed',
                message: `Nothing to update`
            });
        }
        if (dob !== undefined && (!toDate(dob) || toDate(dob) > Date.now() || Math.abs(Date.now() - toDate(dob)) < 16 * 365 * 24 * 60 * 60 * 1000)) {
            return res.status(400).json({
                result: 'failed',
                data: {},
                message: 'Dob can not be empty, must be in format yyyy-mm-dd/dd-mm-yyyy, must be greater than the current Date and your year old smaller than 16.'
            });
        }
        if (phone !== undefined) {
            phone = phone.replace(/\s/g, '');
            if (!isLength(phone, { min: 10, max: 12 }) || !isNumeric(phone)) {
                return res.status(400).json({
                    result: 'failed',
                    data: {},
                    message: 'Phone can not be empty and must be from 10 - 12 numbers.'
                });
            }
        }

        // Update User
        curUser.forEach(async (user) => {
            await user.update({
                fullname: fullname ? fullname : curUser.fullname,
                email: email ? email : curUser.email,
                phone: phone ? phone : curUser.phone,
                dob: dob ? dob : curUser.dob
            })
            res.json({
                result: 'ok',
                data: curUser,
                message: `Update User successfully.`
            })

        })


    } catch (error) {
        res.status(500).json({
            result: 'failed',
            message: `Update User failed.`
        })
        console.log(error)
    }
}

// upload avatar
const upload_avatar = async (req, res) => {
    try {
        let formidable = require('formidable');

        let form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            var oldpath = files.filetoupload.path;
            var newpath = './public/images/uploads/' + files.filetoupload.name;
            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
                res.write('File uploaded and moved!');
                res.end();
            });
        })
        form.uploadDir = './public/images/uploads';
        form.keepExtensions = true;
        form.maxFieldsSize = 2 * 1024 * 1024; // 2MB
        return form.parse(req, next, (err, field, files) => {
            if (err) {
                return res.status(400).json({
                    result: 'failed',
                    message: err
                })
            }
            const arrayOfFiles = files["avatar"];
            // console.log(arrayOfFiles)
            if (arrayOfFiles.size == 0) {
                res.status(400).json({
                    result: 'failed',
                    message: `Nothing to upload`
                })
            }
        })
        // TODO:

        // const up = upload.single('avatar');
        // const error = await up(req, res, (error) => {
        //     if (error) { //instanceof multer.MulterError
        //         if (error.code == 'LIMIT_FILE_SIZE') {
        //             error.message = 'File Size is too large. Allowed file size is 200KB';
        //         }                
        //         return req.error = error.message;
        //     }
        // })
        // console.log(req.error)
        // // if(error){
        // //     return res.status(400).json({
        // //         result: 'failed',
        // //         message: error
        // //     })
        // // }
        // console.log('continue')
        // if (req.error !== undefined) {
        //     return res.status(400).json({
        //         result: 'failed',
        //         message: req.error
        //     })
        // }
        // validate id
        let { id } = req.params;
        // id = parseInt(id);
        if (!id || id === undefined || isEmpty(id) || !isNumeric(id)) {
            return res.status(400).json({
                result: 'failed',
                message: 'Id cannot empty and must be a number'
            })
        }

        // Find user by id
        const curUser = await verifyUserId(id);
        if (curUser == 0) {
            return res.status(400).json({
                result: 'failed',
                message: `Not found any User with id = ${id}`
            })
        }

        // Check match id
        if (req.user._id != curUser[0].id) {
            return res.status(403).json({
                result: 'failed',
                message: `Your request denied`
            })
        }

        // Validation result
        const validation_err = validationResult(req);
        if (!validation_err.isEmpty()) {
            return res.status(422).json({
                result: 'failed',
                message: validation_err.array()
            });
        }

        // Insert avatar
        const entry = await User.update({
            avatar: req.file.filename
        },
            {
                where: { id: parseInt(curUser[0].id) }
            });
        res.json({
            result: 'ok',
            data: entry,
            message: `Upload avatar successfully.`
        })

    } catch (error) {
        res.status(500).json({
            result: 'failed',
            message: `Upload avatar failed.`
        })
        console.log(error)
    }
}

export { register_user, find_user, login, update_user, upload_avatar }