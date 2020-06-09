import express from 'express';
const router = express.Router();
import verifyToken from '../middlewares/verifyToken';

import {all_category, add_category, update_cate, delete_cate} from '../controllers/category';

router.get('/', all_category);
router.post('/', verifyToken, add_category);
router.put('/:id', verifyToken, update_cate);
router.delete('/:id', verifyToken, delete_cate);

export default router;