const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType, Message } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { language=false, taskStatus=false, reason=false, displayOrderNo=false, messageID } = arguments

    const updateClause = {}
    if(language) {
        updateClause.language = language
    }

    if(taskStatus) {
        updateClause.status = taskStatus
    }

    if(reason) {
        updateClause.reason = reason
    }

    if(displayOrderNo) {
        updateClause.displayOrderNo = displayOrderNo
    }

    try {
        let newMessage = await Message.update(updateClause, {
            where: {
                ID: messageID,
                TenantID: tenantHash
            },
            returning: true,
            plain: true
        })

        return newMessage[1].toJSON()

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
