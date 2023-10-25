const middy = require('middy');
const { middleware } = require("../sequelize-middleware");


const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType, TaskInvite } } = models

    const { arguments, agentID } = event
    const { limit = 5, offset = 0, status = false } = arguments

    const { tenantHash, requesterUser } = event

    try {
        const invites = await TaskInvite.findAll({
            where: {
                TenantID: tenantHash
            },
            include: {
                model: Task,
                include: [
                    { model: TaskType },
                    { model: Agent },
                    { model: Team },
                    {model: TaskHistory }
                ]
            },
            order: [
                ['createdAt', 'DESC' ]
            ]
        })

        console.log('invites', invites)
        const filteredInvites = []
        invites.map(e => {
            const temp = e.toJSON()
            temp.rejectedBy = temp.rejectedBy || []
            if ((temp.agentID && temp.agentID.includes(requesterUser)) && (temp.rejectedBy && !temp.rejectedBy.includes(requesterUser)) && (temp.Task.taskStatus === 'PENDING_ACCEPTANCE') ){
                filteredInvites.push(temp)
            }
        })

        return filteredInvites
    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }