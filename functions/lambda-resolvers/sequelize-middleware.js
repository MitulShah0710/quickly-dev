const { initSequelize } = require('../models/init-sequelize')
let sequelizeSync = null

module.exports.middleware = async (handler, next, DB_SCHEMA) => {
    if (sequelizeSync !== null) {
        console.log('Skipping sequelize sync')
        handler.context.models = sequelizeSync
        return
    } else {
        console.log('Initiating sequelize sync')
        sequelizeSync = await initSequelize(handler.event, DB_SCHEMA)
        handler.context.models = sequelizeSync
        return
    }
}