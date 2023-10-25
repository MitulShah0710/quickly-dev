const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { ID, name = false, isDelivery = false, items = [] } = arguments

    const updateClause = {
        updatedBy: requesterUser
    }

    if(name) {
        updateClause.name = name
    }

    if(isDelivery) {
        updateClause.isDelivery = isDelivery
    }

    if(items.length) {
        updateClause.items = items
    }

    try {
        let newTaskType = await TaskType.update(updateClause, {
            where: {
                ID: ID,
                TenantID: tenantHash
            },
            returning: true,
            plain: true
        })

        return newTaskType[1].toJSON()
        
    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
