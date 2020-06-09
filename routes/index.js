import { Router } from 'express';
import {all_category, add_category, update_cate, delete_cate} from '../controllers/category';

const router = Router();

/* GET home page. */
router.get('/', async(req, res) => {
  // const categories = all_category(req);
  // console.log(categories)
  // res.render('index', { title: 'Express' });
  res.json({
    result: 'ok',
    message: `Welcome to Banh Mi Shop APIs`
  })
});

export default router;
