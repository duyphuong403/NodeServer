import Category from '../models/Category';
import { isEmpty, isNumeric, isLength } from 'validator';
import { Op } from 'sequelize';

import {client} from '../middlewares/redis';

// Find all categories and find by name
const all_category = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const offset = (page - 1) * limit;
        // find result in Redis
        // const cate_result = await client.get(`product-search${search}-page${page}-limit${limit}`).then((data) => {
        //     console.log(`data ${JSON.stringify(data)}`);
        //     if (data !== null && !isEmpty(data)) {
        //         return data;
        //     }
        // }).catch((err) => {
        //     throw err;
        // })
        // if (cate_result !== undefined && !isEmpty(cate_result)) {
        //     res.json({
        //         result: 'ok',
        //         data: JSON.parse(cate_result),
        //         message: 'Get Category successfully'
        //     });
        //     return;
        // }

        let cate = {};
        let allCate = {};
        if (!isEmpty(search)) {
            if (!isLength(search, {min: 0, max: 100})){
                res.status(400).json({
                    result: 'failed',
                    data: {},
                    message: 'The Search must be less than 100 chars'
                });
                return;
            }
            // Find by name
            allCate = await Category.findAll({
                // attributes: ['name', 'description'],
                where: {
                    name: {
                        [Op.like]: '%' + search + '%'
                    }
                }
            });

            cate = await Category.findAll({
                // attributes: ['name', 'description'],
                limit,
                offset,
                order: [['name', 'ASC']],
                where: {
                    name: {
                        [Op.like]: '%' + search + '%'
                    }
                }
            });
            // console.log(cate);
            if(cate.length <= 0 || cate === null){
                res.status(404).json({
                    result: 'failed',
                    data: [],
                    message: 'Not found any Category'
                });
                return;
            }
        } else {
            // get all
            allCate = await Category.findAll({
                // attributes: ['name', 'description'],
                order: [['name', 'ASC']]
            });

            cate = await Category.findAll({
                // attributes: ['name', 'description'],
                limit,
                offset,
                order: [['name', 'ASC']]
            });
        }

        // check req.page > total page in data
        if (page > Math.ceil(allCate.length / limit)) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: 'Page cannot greater than total Page'
            })
            return;
        }
        // client.setex(`category-search${search}-page${page}-limit${limit}`, 3600, JSON.stringify(cate));

        res.json({
            result: 'ok',
            data: cate,
            rows: allCate.length,
            pages: Math.ceil(allCate.length / limit)
        })
    } catch (error) {
        res.status(500).json({
            result: 'failed',
            message: `${error}`
        })
    }
}

// Insert
const add_category = async (req, res) => {
    try {
        let { name, description } = req.body;
        if (name === undefined || name == null || isEmpty(name)) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: 'name can not be empty'
            })
            return;
        };
        // check name exists 
        let cate = await Category.findAll({
            attributes: ['name'],
            where: { name }
        })
        if (cate.length > 0) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: 'name has been already exists'
            });
            return;
        }

        let newCate = await Category.create({
            name,
            description
        }, {
            fields: ['name', 'description'] // arrays will be consider to insert into DB
        });
        if (newCate) {
            res.json({
                result: 'ok',
                data: newCate,
                message: 'Insert a new Category successfully'
            })
        } else {
            res.status(500).json({
                result: 'failed',
                data: {},
                message: 'Insert a new Category failed'
            })
        }
    } catch (error) {
        res.json({
            error: `${error}`
        })
    }
};

// Update
const update_cate = async (req, res) => {
    try {
        const { id } = req.params;
        if (id === undefined || !isNumeric(id)) {
            res.json({
                result: 'failed',
                data: {},
                message: 'id can not be empty and must be a number'
            })
            return;
        }
        let curCate = await Category.findAll({
            attributes: ['id', 'name', 'description'],
            where: { id }
        })
        if (curCate.length <= 0) {
            res.json({
                result: 'failed',
                data: {},
                message: `Not found any Category with id = ${id}`
            })
            return;
        }
        let { name, description } = req.body;
        if ((name === undefined || name == null || isEmpty(name)) && (description === undefined || description == null || isEmpty(description))) {
            res.json({
                result: 'ok',
                data: {},
                message: 'Nothing to update'
            })
            return;
        };
        curCate.forEach(async (cate) => {
            await cate.update({
                name: name ? name : cate.name,
                description: description ? description : cate.description
            });
            res.json({
                result: 'ok',
                data: curCate,
                message: 'Update a Category successfully'
            })
        })
    } catch (error) {
        res.json({
            error: `${error}`
        })
    }
};

// Delete
const delete_cate = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isNumeric(id)) {
            res.status(400).json({
                result: 'failed',
                data: {},
                message: `id must be a number.`
            });
            return;
        }

        let numberOfDeletedRows = await Category.destroy({
            where: {
                id: parseInt(id)
            }
        }).catch((error) => {
            console.log(error.original.code);
            let err = {};
            if (error.original.code == 23503) {
                err = `The Category contains Products. You must delete Product before.`;
            } else {
                err = error.original.code;
            }
            res.status(400).json({
                result: 'failed',
                error_code: error.original.code,
                message: err
            })
            return;
        });

        if (numberOfDeletedRows)
            res.json({
                result: 'ok',
                message: 'Delete a Category successfully',
                count: numberOfDeletedRows
            })
    } catch (error) {
        res.status(500).json({
            result: 'failed',
            message: `${error}`
        })
    }
}

export { all_category, add_category, update_cate, delete_cate };