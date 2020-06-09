import Sequelize from 'sequelize';
import {sequelize} from '../database/database'; 

const User = sequelize.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    username: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    fullname: {
        type: Sequelize.STRING
    },
    isbanned: {
        type: Sequelize.BOOLEAN
    },
    role: {
        type: Sequelize.TINYINT
    },
    avatar: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    phone: {
        type: Sequelize.TINYINT
    },
    dob: {
        type: Sequelize.DATEONLY
    },
    created_at: {
        type: Sequelize.DATE
    },
    last_logged_in: {
        type: Sequelize.DATE
    },
},{
    timestamps: false
});

export default User;