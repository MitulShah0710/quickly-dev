const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { WebUser, Team, Task, Agent, Hub } } = models
    const { tenantHash, requesterUser } = event
    try {
        const webUser = await WebUser.findOne({
            where: {
                ID: requesterUser,
                TenantID: tenantHash
            },
            include: [{
                model: Team,
                include: [{
                    model: Task,
                }, {
                    model: Agent,
                }, {
                    model: Hub,
                }]
            }]
        })
        if(webUser !== null) {
            console.log('WebUser info', JSON.stringify(webUser.toJSON()))
            return webUser
        }
        else {
            throw new Error('Web user not found');
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