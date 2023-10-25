const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils')

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Task } = models
    const { arguments, requesterUser, tenantHash } = event
    const { taskID, teamID } = arguments

    //task model building
    try {
        let TaskObj = await Task.update({ TeamID: teamID, updatedBy: requesterUser }, {
            where: {
                TenantID: tenantHash,
                ID: taskID
            },
            returning: true,
            taskHistoryDisable: true
        })

        console.log('Update result', TaskObj)
        TaskObj = TaskObj[1][0];

        const relations = {}
        relations.Team = await TaskObj.getTeam()
        relations.Agent = await TaskObj.getAgent()

        TaskObj = { ...TaskObj.toJSON(), ...relations }
        console.log('final task obj after update', JSON.stringify(TaskObj))
        return TaskObj

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
