const middy = require('middy');
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Hub, Team } = models

    const { arguments, tenantHash } = event
    const { limit = 1000, offset = 0 } = arguments

    try {
        const { rows, count } = await Hub.findAndCountAll({
            where: {
                TenantID: tenantHash
            },
            limit,
            offset,
            include: { model: Team }
        })
        console.log('HUb info', JSON.stringify(rows))

        return {
            hubs: rows || [],
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