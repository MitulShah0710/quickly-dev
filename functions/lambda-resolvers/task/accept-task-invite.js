const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils');
const { Op } = require('sequelize');

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Task, TaskInvite, Tenant, TaskHistory } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { inviteID } = arguments

    //task model building
    try {

        //finding invite from DB
        const taskInvite = await TaskInvite.findOne({
            where: {
                ID: inviteID
            },
            include: { model: Task }
        })

        //if no invite it means it is already accepted
        if (!taskInvite) {
            throw new Error('Invite is already accepted!')
        }

        const tenant = await Tenant.findOne({
            where: {
                ID: tenantHash
            },
            attributes: { exclude: ['apiKeyId', 'apiKeyValue']}
        })

        const agentsTask = await Task.findAndCountAll({
            where: {
                TenantID: tenantHash,
                AgentID: requesterUser,
                [Op.or]: [
                    { taskStatus: 'ASSIGNED' },
                    { taskStatus: 'ACCEPTED' },
                    { taskStatus: 'IN_TRANSIT' },
                    { taskStatus: 'ON_SITE' }
                ]
            }
        })

        console.log('task invite', JSON.stringify(taskInvite))
        const { configs: { max_tasks_per_agent = Number.POSITIVE_INFINITY }} = tenant

        if(agentsTask.count && agentsTask.count >= max_tasks_per_agent && taskInvite.Task.groupTask !== true) {
            throw new Error('Max Task per Agent limit exceeded')
        }

        //finding task for update
        let task = await Task.update({
            AgentID: requesterUser,
            taskStatus: 'ASSIGNED', // Status currently working
            // taskStatus: 'ACCEPTED', 
            updatedBy: requesterUser
        }, {
            where: {
                TenantID: tenantHash,
                ID: taskInvite.TaskID,
                taskStatus: 'PENDING_ACCEPTANCE',
            },
            returning: true,
            taskHistory: {
                changedBy: requesterUser,
                comment: 'Accepted by Agent'
            },
        })

        task = task[1][0];
        console.log('Task updated agent assigned!', task)

        // await TaskHistory.create({
        //     TenantID: tenantHash,
        //     TaskID: task.ID,
        //     // timestamp: new Date().getTime(),
        //     status: task.taskStatus,
        //     changedBy: requesterUser,
        //     comment: 'Accepted by Agent'
        // })

        //deleting invite to stop next accept events
        await TaskInvite.destroy({
            where: {
                ID: inviteID
            }
        })
        console.log('Invite deleted!')

        const afterUpdateTask = await Task.findOne({
            where: {
                ID: task.ID,
                TenantID: tenantHash
            }
        })

        const associations = {}
        associations.Team = await afterUpdateTask.getTeam()
        associations.Agent = await afterUpdateTask.getAgent()
        associations.TaskType = await afterUpdateTask.getTaskType()
        associations.TaskHistories = await afterUpdateTask.getTaskHistories()

        return { ...afterUpdateTask.toJSON(), ...associations }

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})

module.exports = { handler }
