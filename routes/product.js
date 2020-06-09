import express from 'express';
const router = express.Router();
import {add_product, get_product, update_product, delete_product, get_product_by_cate} from '../controllers/product';
import { check } from 'express-validator';

//Get product
router.get('/', get_product)
router.get('/:cateId',[check('cateId').notEmpty().isNumeric()], get_product_by_cate)
//Insert
router.post('/', add_product)
router.put('/:id', update_product)
router.delete('/:id', [check('id').notEmpty().isNumeric()], delete_product)

export default router;