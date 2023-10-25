const middy = require('middy');
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType } } = models

    const { arguments } = event
    const { limit = 500, offset = 0 } = arguments

    const { tenantHash } = event
    if (arguments.taskID && arguments.taskID !== null) {
        try {
            const task = await Task.findOne({
                where: {
                    TenantID: tenantHash,
                    ID: arguments.taskID
                },
                include: [
                    {
                        model: Agent,
                    },
                    {
                        model: Team,
                    },
                    {
                        model: TaskHistory,
                        
                    },
                    {
                        model: TaskType,
                    }
                ],
                order: [
                    [{ model: TaskHistory }, 'createdAt', 'DESC' ]
                ]
            })
            console.log('Task info', JSON.stringify(task))

            return {
                tasks: [task],
                count: 1
            }
        } catch (e) {
            console.log('Error at query', JSON.stringify(e))
            throw e
        }
    } else {
        try {
            const { rows, count } = await Task.findAndCountAll({
                where: {
                    TenantID: tenantHash
                },
                include: [
                    {
                        model: Agent,
                    },
                    {
                        model: Team,
                    },
                    {
                        model: TaskHistory,
                        order: ['createdAt', 'DESC']
                    },
                    {
                        model: TaskType,
                    }
                ],
                limit,
                offset,
                order: [
                    [{ model: TaskHistory }, 'createdAt', 'DESC' ],
                    ['updatedAt', 'DESC']
                ]
            })
            console.log('Task info', JSON.stringify(rows))

            if (count === 0) {
                console.log('No tasks with the tenant')
            }
            return {
                tasks: rows,
                count
            }
        } catch (e) {
            console.log('Error at query', JSON.stringify(e))
            throw e
        }
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }