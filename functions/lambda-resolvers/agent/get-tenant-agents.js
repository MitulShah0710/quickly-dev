const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Agent, Team, AgentTeams } } = models
    const { arguments } = event
    const { tenantID, teamID, agentStatus } = arguments

    try {
        const result = await Team.findOne({
            where: {
                TenantID: tenantID,
                ID: teamID
            },
            include: {
                model: Agent,
                where: {
                    status: agentStatus
                }
            },
            attributes: []
        })

        console.log('result', JSON.stringify(result))
        return result ? result.Agents : []
    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }