const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils')

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Task, TaskInvite } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { inviteID } = arguments

    //task model building
    try {

        //finding invite from DB
        const taskInvite = await TaskInvite.findOne({
            where: {
                ID: inviteID
            }
        })

        //if no invite it means it is already accepted
        let inviteJSON = taskInvite.toJSON()
        console.log('Task invite found!', JSON.stringify(inviteJSON), inviteJSON.rejectedBy, typeof inviteJSON.rejectedBy)
        if (!taskInvite) {
            throw new Error('Invite is already accepted!')
        }

        inviteJSON.rejectedBy = [...inviteJSON.rejectedBy || [], requesterUser ]
        taskInvite.rejectedBy = inviteJSON.rejectedBy
        await taskInvite.save()

        return true

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
