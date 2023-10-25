const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { name, isDelivery, items } = arguments

    try {
        let newTaskType = await TaskType.create({
            name,
            isDelivery,
            createdBy: requesterUser,
            TenantID: tenantHash,
            items
        })

        return newTaskType

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
