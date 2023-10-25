const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType, Message } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { language, taskStatus, reason, displayOrderNo, taskTypeID } = arguments

    try {
        let newMessage = await Message.create({
            language,
            status: taskStatus,
            reason, 
            displayOrderNo,
            createdBy: requesterUser,
            TenantID: tenantHash,
            TaskTypeID: taskTypeID
        })

        return newMessage

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
