const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils')
const { env: { PRIVATE_API_ENDPOINT }} = process
const axios = require('axios')

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskInvite } } = models
    const { arguments, requesterUser="API_KEY", tenantHash } = event
    const { taskID, newStatus, tenantID=null, comment = false } = arguments
    const validUnassigedStatus = [
        "PENDING_ACCEPTANCE",
        "ACCEPTED",
        "ASSIGNED",
        "IN_TRANSIT",
        "INVALID_LOCATION"
    ]

    const validPendingAcceptanceStatus = [
        "NOT_ASSIGNED"
    ]

    const validInvalidLocationStatus = [
        "NOT_ASSIGNED"
    ]

    let updateClause = {}

    const passedTenantHash = tenantHash ? tenantHash : tenantID

    try {

        let taskDetailsBeforeUpdate = await Task.findOne({
            where: {
                TenantID: passedTenantHash,
                ID: taskID
            }
        })

        taskDetailsBeforeUpdate = taskDetailsBeforeUpdate.toJSON()
        console.log('Old task status', taskDetailsBeforeUpdate.taskStatus);
        let TaskObj = {};

        /* For now only accept changes to NOT_ASSIGNED and PENDING_ACCEPTANCE from specific Task's states
        */
        if ( ( newStatus === 'NOT_ASSIGNED' &&
               validUnassigedStatus.includes(taskDetailsBeforeUpdate.taskStatus)) ||
             ( newStatus === 'PENDING_ACCEPTANCE' &&
               validPendingAcceptanceStatus.includes(taskDetailsBeforeUpdate.taskStatus)) ||
             ( newStatus === 'INVALID_LOCATION' &&
               validInvalidLocationStatus.includes(taskDetailsBeforeUpdate.taskStatus))
            ) {
            if(newStatus === 'NOT_ASSIGNED') {
                updateClause.taskInvite = 'UNSENT';
                await TaskInvite.destroy({
                    where: {
                        TaskID: taskID,
                    }
                });
                console.log(`Invites deleted as task status is changed to 'NOT_ASSIGNED'`);
            }

            if (comment !== false) updateClause.commentsByAgent = comment
            /* Commenting out to keep AgentID so that taskUpdatedByUser subscription get notifications */
            //if (newStatus === 'NOT_ASSIGNED') updateClause.AgentID = null

            TaskObj = await Task.update({ taskStatus: newStatus, updatedBy: requesterUser, ...updateClause }, {
                where: {
                    TenantID: passedTenantHash,
                    ID: taskID
                },
                returning: true,
                taskHistory: {
                    comment,
                }
            })

            console.log('Update result', TaskObj)
            TaskObj = TaskObj[1][0];

            // await TaskHistory.create({
            //     TenantID: passedTenantHash,
            //     TaskID: TaskObj.ID,
            //     status: TaskObj.taskStatus,
            //     changedBy: TaskObj.createdBy,
            //     comment
            // })

        } else {
            // Task status is not valid, return an error
            throw new Error("Invalid Task status transition")
        }

        const relations = {}
        relations.Team = await TaskObj.getTeam()
        relations.Agent = await TaskObj.getAgent()
        relations.TaskType = await TaskObj.getTaskType()

        TaskObj = { ...TaskObj.toJSON(), ...relations }
        console.log('final task obj after update', JSON.stringify(TaskObj))
        if ( newStatus === 'NOT_ASSIGNED') {
            // Send event to SNS
            await axios.post(`${PRIVATE_API_ENDPOINT}/task-events`, {
                attributes: {
                    entity: "TASK",
                    event: TaskObj.taskStatus,
                    notifications: ['WA', 'EMAIL'] // Should read from Tenant data
                },
                details: TaskObj
            }, {
                headers: {
                    'InvocationType': 'Event'
                }
            })
            .then(function (response) {
                console.log('axios task-events response', response);
            })
            .catch(function (error) {
                console.log('axios task-events error', error);
            });
        }

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