const middy = require('middy');
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType } } = models

    const { arguments } = event
    const { tenantID, teamID, taskID } = arguments

    const taskDetails = await Task.findOne({
        where: {
            TenantID: tenantID,
            ID: taskID,
            TeamID: teamID
        },
        include: [
            { model: Agent },
            { 
                model: Team 
            },
            { model: TaskHistory },
            { model: TaskType }
        ]
    })

    console.log('Final task details', JSON.stringify(taskDetails))
    return taskDetails
})

handler.use({
    before: middleware
})


module.exports = { handler }