const { initSequelize } = require('./models/init-sequelize')

module.exports.handler = async (event, context) => {
    const { alter } = event
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Sequelize syncing started!')
    await initSequelize({ alter })
    console.log('Sequelize synced!')
    return
}