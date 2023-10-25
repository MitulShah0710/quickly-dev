const middy = require('middy');
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory } } = models

    const { arguments } = event
    const { taskID } = arguments

    const { tenantHash } = event
    try {
        const {rows, count} = await TaskHistory.findAndCountAll({
            where: {
                TenantID: tenantHash,
                TaskID: taskID
            },
            order: [
                ['createdAt', 'DESC']
            ]
        })
        console.log('Task history info', JSON.stringify({ rows, count }))

        return rows

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }