import Sequelize from 'sequelize';
export const sequelize = new Sequelize(
    'banhmishop', // db name
    'postgres', // username
    '1234', // pwd
    {
        dialect: 'postgres',
        host: 'localhost',
        // operatorsAliases: false,
        pool:{
            max: 5, // limit concurrent access
            min: 0,
            require: 30000, // 30s timeout
            idle: 10000, // waiting
        }
    }
);

export const Op = Sequelize.Op;
