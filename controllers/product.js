import { isNumeric, isEmpty, isInt, isLength } from 'validator';
import { Op } from 'sequelize';
import { validationResult } from 'express-validator';
import { set_redis, get_redis } from '../middlewares/redis';

import Product from '../models/Product';
import Category from '../models/Category';

// Get product by Category
const get_product_by_cate = async (req, res) => {
    try {
        const { cateId } = req.params;

        // Get products by Category Id
        if (cateId === undefined || isEmpty(cateId) || !isNumeric(cateId)) {
            return res.status(400).json({
                result: 'failed',
                data: {},
                message: 'The cateId must be a number'
            });
        }

        // get row by name
        const result = await Product.findAll({
            attributes: ['name', 'description', 'price'],
            // limit,
            // offset,
            order: [['name', 'ASC']],
            where: {
                cateid: cateId
            },
            include: {
                model: Category,
                as: 'category',
                required: true
            }
        })
        if (result.length > 0) {
            return res.json({
                result: 'ok',
                data: result,
                message: `Get Product by Category Successfully`
                // rows: allProduct.length,
                // pages: Math.ceil(allProduct.length / limit)
            })
        }else{
            return res.json({
                result: 'failed',
                data: [],
                message: `Not found any Product with CateId = ${cateId}`
            })
        }
    } catch (error) {
        res.status(500).json({
            result: 'failed',
            message: `Get product by Category failed. ${error}`
        })
    }
}

// Get product by search
const get_product = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const offset = (page - 1) * limit;

        const redis_key = `product-search${search}-page${page}-limit${limit}`;

        const prod = await get_redis(redis_key);

        if (prod !== undefined && prod !== null && !isEmpty(prod)) {
            res.json({
                result: 'ok',
                data: JSON.parse(prod),
                message: 'Get Product with Redis successfully'
            });
            return;
        }

        let product = {};
        let allProduct = {};

        // Get products by search by name
        if (!isEmpty(search)) {
            if (!isLength(search, { min: 0, max: 100 })) {
                res.status(400).json({
                    result: 'failed',
                    data: {},
                    message: 'The Search must be less than 100 chars'
                });
                return;
            }
            // get all rows
            allProduct = await Product.findAll({
                attributes: ['name', 'description', 'price'],
                where: {
                    name: {
                        [Op.like]: '%' + search + '%'
                    }
                }
            });

            // get row by name
            product = await Product.findAll({
                attributes: ['name', 'description', 'price'],
                limit,
                offset,
                order: [['name', 'ASC']],
                where: {
                    name: {
                        [Op.like]: '%' + search + '%'
                    },
                },
                include: {
                    model: Category,
                    as: 'category',
                    required: true
                }
            })
            // console.log(JSON.stringify(product));
        } else {
            // get all
            allProduct = await Product.findAll({
                attributes: ['name', 'description', 'price'],
                order: [['name', 'ASC']]
            });

            product = await Product.findAll({
                attributes: ['name', 'description', 'price'],
                limit,
                offset,
                order: [['name', 'ASC']],
                include: {
                    model: Category,
                    as: 'category',
                    required: true,
                    // attributes: ['name']
                }
            });
        }

        set_redis(redis_key, 300, product);
        // check req.page > total page in data
        // console.log(allProduct.length);

        if (page > Math.ceil(allProduct.length / limit)) {
            return res.status(400).json({
                result: 'failed',
                data: {},
                message: 'Page cannot greater than total Page'
            })
        }

        return res.json({
            result: 'ok',
            data: product,
            rows: allProduct.length,
            pages: Math.ceil(allProduct.length / limit)
        })
    } catch (error) {
        res.status(500).json({
            result: 'failed',
            message: `Get product failed. ${error}`
        })
    }
};

// Insert
const add_product = async (req, res) => {
    try {
        let { name, price, cateid } = req.body;
        if (name === undefined || name == null || isEmpty(name)) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: 'name can not be empty'
            })
            return;
        };
        if (price === undefined || price === null || !isInt(price, { min: 0, max: 99999 }) || isEmpty(price)) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: 'Price must be in range [0-99999]'
            })
            return;
        }
        if (cateid === undefined || !isNumeric(cateid) || isEmpty(cateid)) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: 'cateid must be a INTEGER'
            })
            return;
        }

        // check category
        let category = await Category.findAll({
            // attributes: ['id', 'name', 'description'],
            where: {
                id: cateid
            }
        })
        if (category.length <= 0) {
            res.status(404).json({
                result: 'failed',
                data: {},
                message: `Not found any Category with cateid = ${cateid}`
            })
            return;
        }

        // Check exists product name
        let curProd = await Product.findAll({
            attributes: ['name'],
            where: {
                name
            }
        })
        if (curProd.length > 0) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: 'name has been already exists'
            })
            return;
        }

        let newProd = await Product.create({
            name,
            price,
            cateid,
            createdat: Date.now()
        }, {
            fields: ['name', 'price', 'cateid', 'createdat']
        });

        if (newProd) {
            res.json({
                result: 'ok',
                data: newProd,
                message: 'Insert a new Product successfully'
            })
        } else {
            res.status(500).json({
                result: 'failed',
                data: {},
                message: 'Insert a new Product failed'
            })
        }
    } catch (error) {
        res.status(500).json({
            result: 'failed',
            data: {},
            message: 'Insert a new Product failed'
        })
        console.log(`error: ${error}`)
    }
};

// Update
const update_product = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, cateid } = req.body;
        // console.log(req.body);
        // validate
        if (!isNumeric(id)) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: `id must be a number`
            })
            return;
        }
        if (req.body.constructor === Object) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: `Nothing to update`
            })
            return;
        }
        if (name !== undefined && (isEmpty(name.trim()) || !isLength(name, { min: 1, max: 1000 }))) {
            res.status(400).json({
                result: 'failed',
                message: `name can not empty and must be 1-1000 characters.`
            })
            return;
        }
        if (price !== undefined && (isEmpty(price.trim()) || !isNumeric(price.trim(), { min: 0, max: 2147483647 }))) {
            res.status(400).json({
                result: 'failed',
                message: `price can not empty and must be 0-2.147.483.647.`
            })
            return;
        }

        // if cateid
        if (cateid !== undefined) {
            let cate_trim = cateid.trim();
            if (!isNumeric(cate_trim)) {
                res.status(400).json({
                    result: 'failed',
                    message: 'cateid must be a number'
                })
                return;
            } else {
                const category = await Category.findAll({
                    where: { id: parseInt(cate_trim) }
                }).catch((error) => {
                    throw error;
                })
                if (category.length <= 0) {
                    res.status(404).json({
                        result: 'failed',
                        data: {},
                        message: `Not found any Category with cateid = ${cate_trim}`
                    })
                    return;
                }
            }
        }

        // find prod
        const curProd = await Product.findAll({
            where: { id: parseInt(id) }
        }).catch((error) => {
            throw error;
        })
        if (curProd.length <= 0) {
            res.status(404).json({
                result: 'failed',
                data: {},
                message: `Not found any Product with id = ${id}`
            })
        } else {
            curProd.forEach(async (prod) => {
                await prod.update({
                    name: name ? name : prod.name,
                    price: price ? price : prod.price,
                    cateid: cateid ? cateid : cateid,
                    updatedat: Date.now()
                });
                res.json({
                    result: 'ok',
                    data: curProd,
                    message: 'Update a Product successfully'
                })
            })
        }
    } catch (error) {
        res.status(500).json({
            result: 'failed',
            data: {},
            message: 'Update a Product failed'
        })
        console.log(`error: ${error}`)
    }
}

const delete_product = async (req, res) => {
    try {
        const err = validationResult(req);
        if (!err.isEmpty()) {
            res.send(err);
            return
        }

        const { id } = req.params;
        const prod = await Product.destroy({
            where: { id: parseInt(id) }
        }).catch((error) => {
            res.json(error)
        })
        res.json({
            result: 'ok',
            data: prod,
            message: 'Delete a Product successfully'
        })
    } catch (error) {
        res.status(500).json({
            result: 'failed',
            message: 'Delete a product failed'
        })
        console.log(`error: ${error}`)
    }
}

export { get_product_by_cate, get_product, add_product, update_product, delete_product }