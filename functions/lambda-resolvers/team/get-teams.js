const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, WebUser, Agent, Hub, Task } } = models
    const { tenantHash, arguments } = event
    const { limit = 1000, offset = 0 } = arguments

    try {
        const { rows, count } = await Team.findAndCountAll({
            where: {
                TenantID: tenantHash
            },
            include: [{
                model: WebUser,
            }, {
                model: Agent,
            }, {
                model: Hub,
            },{
                model: Task,
            }],
            limit,
            offset,
            order: [
                [{model: Task}, 'updatedAt', 'DESC']
            ]
        })

        console.log('All Teams Info', JSON.stringify(rows))
        return {
            teams: rows || [],
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