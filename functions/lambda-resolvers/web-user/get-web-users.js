const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { WebUser, Team } } = models
    const { tenantHash, arguments } = event
    const { limit = 5000, offset = 0, type } = arguments
    const param = {
        where: {
            TenantID: tenantHash,
        },
        limit,
        offset,
        include: { model: Team }
    }

    if (type === 'TENANT_ADMIN' || type === 'DISPATCHER') {
        param.where['userType'] = type
    }

    try {
        const { rows, count } = await WebUser.findAndCountAll(param)
        console.log('All webUsers info', JSON.stringify(rows))
        
        return {
            webUsers: rows,
            total: count,
            page: offset,
            count
        }

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }