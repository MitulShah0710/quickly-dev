const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: {Agent, Team} } = models

    const { tenantHash, requesterUser } = event
    const param = {
        where: {
            TenantID: tenantHash,
            ID: requesterUser
        },
        include: { model: Team }
    }

    try {
        const agentProfile = await Agent.findOne(param)
        console.log('Tenant info', JSON.stringify(agentProfile))
        return agentProfile
    
    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }