const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType, Message } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { ID } = arguments

    try {
        const deleteRequest = await Message.destroy({
            where: {
                ID
            }
        })

        if (deleteRequest > 0) {
            return true
        } else {
            return false
        }
    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
