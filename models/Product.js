import Sequelize from 'sequelize';
import {sequelize} from '../database/database'; // {} import many module

import Option from './Option';
import ProductImage from './ProductImage';

const Product = sequelize.define('products', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    },
    price: {
        type: Sequelize.INTEGER
    },
    // review: {
    //     type: Sequelize.TEXT
    // },
    cateid: {
        type: Sequelize.INTEGER
    },
    updatedat: {
        type: Sequelize.DATE
    },
    createdat: {
        type: Sequelize.DATE
    }
},{
    timestamps: false
});

Product.hasMany(Option, {foreignKey: 'prodid', sourceKey: 'id'});
Option.belongsTo(Product, {foreignKey: 'prodid', targetKey: 'id'});
Product.hasMany(ProductImage, {foreignKey: 'prodid', sourceKey: 'id'});
ProductImage.belongsTo(Product, {foreignKey: 'prodid', targetKey: 'id'});

export default Product;