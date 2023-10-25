const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, WebUser, Agent, Hub, Task } } = models

    const { tenantHash, arguments } = event
    const { teamId } = arguments

    try {
        const teamInfo = await Team.findOne({
            where: {
                ID: teamId,
                TenantID: tenantHash
            },
            include: [{
                model: WebUser,
            }, {
                model: Agent,
            }, {
                model: Hub,
            }, {
                model: Task
            }],
            order: [
                [{ model: Task }, 'updatedAt', 'DESC' ]
            ]
        })

        console.log('Team info', JSON.stringify(teamInfo))
        return teamInfo || {}
    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }