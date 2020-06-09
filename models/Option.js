import Sequelize from 'sequelize';
import {sequelize} from '../database/database'; // {} import many module

const Option = sequelize.define('Option', {
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
    quantity: {
        type: Sequelize.INTEGER
    },
    prodid: {
        type: Sequelize.INTEGER
    }
},{
    timestamps: false
});

export default Option;