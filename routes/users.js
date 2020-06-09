import { Router } from 'express';
import { check, body } from 'express-validator';
import verifyToken from '../middlewares/verifyToken';
import {register_user, find_user, login, update_user, upload_avatar} from '../controllers/user';
import { upload } from '../middlewares/upload_images';

const router = Router();


// Find user
router.get('/', verifyToken, find_user);

// Register User
router.post('/register', [
  check('username').notEmpty().withMessage("username can not be empty")
  .isLength({min: 3, max: 255}).withMessage('username must from 8 to 255 characters')
  .trim(),
  check('password').notEmpty().trim().withMessage("password can not be empty")
  .matches(/(^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d]{8,}$)/).withMessage("Password must be at least: 8 letter, 1 upper case, 1 lower case and 1 number").custom((value, { req }) => {
    // console.log(req.body.passwordConfirmation)
    if (value !== req.body.passwordConfirmation) {
      throw new Error('Password confirmation is incorrect');
    }
    return true;
  }),
  check('fullname', 'fullname can not be empty and must be 1 - 255 letters.').trim().notEmpty().isLength({min:1, max: 255}),
  check('email', 'Email can not be empty and in format abc@domain.com').notEmpty().isEmail().isLength({min: 7, max: 255})
], register_user);

// Login
router.post('/login', [
  check('username').notEmpty().withMessage("username can not be empty").trim(),
  check('password').notEmpty().trim().withMessage("password can not be empty")
], login)

// update
router.put('/:id', verifyToken, [
  check('fullname').optional().trim().isLength({min: 1, max: 255}).withMessage('fullname can not be empty and must from 1 to 255 lettets'),
  check('email').optional().trim().isLength({min: 1, max: 255}).isEmail().withMessage('Email can not empty and must be in format ex: name@domain.com')
],update_user)

// Upload avatar
router.post('/upload_avatar/:id', verifyToken, upload_avatar)

export default router;
