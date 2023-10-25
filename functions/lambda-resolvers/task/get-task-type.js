const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType, Message } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { limit = 500, offset = 0, taskID = false } = arguments

    try {

        if (taskID) {
            let task = await TaskType.findOne({
                where: {
                    ID: taskID,
                    TenantID: tenantHash
                },
                include: {
                    model: Message
                }
            })

            return {
                taskTypes: [task],
                count: 1,
                total: 1
            }

        } else {
            let { rows, count } = await TaskType.findAndCountAll({
                where: {
                    TenantID: tenantHash
                },
                include: {
                    model: Message
                },
                limit,
                offset
            })

            return {
                taskTypes: rows,
                count,
                total: count
            }

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
