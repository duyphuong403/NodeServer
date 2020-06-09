import Sequelize from 'sequelize';
import {sequelize} from '../database/database'; // {} import many module

const ProductImage = sequelize.define('ProductImage', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING
    },
    prodid: {
        type: Sequelize.INTEGER
    }
},{
    timestamps: false
});

export default ProductImage;