const middy = require('middy');
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Agent } = models

    const { arguments } = event
    const { agentID, tenantID, lat, long } = arguments

    try {
        let AgentToUpdate = await Agent.findOne({
            where: {
                ID: agentID,
                TenantID: tenantID
            }
        })
        console.log('Agent to update', AgentToUpdate)
        AgentToUpdate.latitude = lat
        AgentToUpdate.longitude = long

        await AgentToUpdate.save()
        console.log('Update success!')

        return AgentToUpdate

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }