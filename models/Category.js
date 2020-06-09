import Sequelize from 'sequelize';
import {sequelize} from '../database/database'; // {} import many module

import Product from './Product';

const Category = sequelize.define('categories', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING
    },
    description: {
        type: Sequelize.STRING
    }
},{
    timestamps: false
});

Category.hasMany(Product, {foreignKey: 'cateid', sourceKey: 'id'})
Product.belongsTo(Category, {foreignKey: 'cateid', targetKey: 'id'})

export default Category;