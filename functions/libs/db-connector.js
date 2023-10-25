const { Sequelize } = require("sequelize");
const { DB_URL, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env

const connector = async (sequelize) => {
    console.log('DB_URL', JSON.stringify({ DB_URL: DB_URL, DB_USERNAME: DB_USERNAME, DB_PASSWORD: DB_PASSWORD }))
    return new Promise((res, rej) => {
        //reusing same connection if available
        if (sequelize !== null) {
            console.log('Existing connection found!')
            res(sequelize)
        } else {
            console.log('Creating new connection!')
            sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
                host: DB_URL,
                dialect: 'postgres',
                // pool: {
                //     max: 15,
                //     min: 5,
                //     idle: 20000,
                //     evict: 15000,
                //     acquire: 30000
                // },
            });
            res(sequelize)
        }
    })
}

module.exports = {
    connector
}