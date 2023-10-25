const middy = require('middy')
const { Op } = require("sequelize");
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Agent, Team, Task } } = models
    const { tenantHash, AgentID } = event
    const { limit = 5000, offset = 0, type } = arguments

    const param = {
        where: {
            TenantID: tenantHash,
            AgentID,
            [Op.or]: [
                { taskStatus: 'ASSIGNED' },
                { taskStatus: 'ACCEPTED' },
                { taskStatus: 'IN_TRANSIT' },
                { taskStatus: 'ON_SITE' }
            ]
        }
    }

    try {
        const { rows, count } = await Task.findAndCountAll(param)
        console.log('Agents info', JSON.stringify(rows))
        return count
    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }