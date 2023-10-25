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
    const { arguments, agentID, tenantHash } = event
    const { taskID, newStatus, latLongs, location, comment = false, deliveryInfo = {} } = arguments
    const { deliverySignature = false, deliveryPhoto = false, deliveryComment = false } = deliveryInfo
    const clockTerminationStatus = [
        "COMPLETED",
        "PARTIALLY_COMPLETED",
        "REJECTED",
        "CANCELLED",
        "FAILED"
    ]


    const clockStartStatus = ["ON_SITE"]
    let updateClause = {}
    //task model building
    try {
        let taskDetailsBeforeUpdate = await Task.findOne({
            where: {
                TenantID: tenantHash,
                ID: taskID,
                AgentID: agentID
            }
        })

        taskDetailsBeforeUpdate = taskDetailsBeforeUpdate.toJSON()

        if (clockStartStatus.includes(newStatus)) {
            updateClause.serviceTime = [new Date().getTime()]
        } else if (clockTerminationStatus.includes(newStatus)) {
            updateClause.serviceTime = [...taskDetailsBeforeUpdate.serviceTime || [], new Date().getTime()]
            updateClause.isCompleted = true
        }

        newStatus === 'COMPLETED' ? updateClause.deliveryDate = new Date() : null;
        if (comment !== false) updateClause.commentsByAgent = comment
        if (deliveryComment !== false) updateClause.deliveryComment = deliveryComment
        if (deliveryPhoto !== false) updateClause.deliveryPhoto = deliveryPhoto
        if (deliverySignature !== false) updateClause.deliverySignature = deliverySignature

        let TaskObj = await Task.update({ taskStatus: newStatus, updatedBy: agentID, ...updateClause }, {
            where: {
                TenantID: tenantHash,
                ID: taskID,
                AgentID: agentID
            },
            returning: true,
            taskHistory: {
                latLongs,
                location,
                comment
            }
        })

        console.log('Update result', TaskObj)
        TaskObj = TaskObj[1][0];

        // await TaskHistory.create({
        //     TenantID: tenantHash,
        //     TaskID: TaskObj.ID,
        //     // timestamp: new Date().getTime(),
        //     status: TaskObj.taskStatus,
        //     changedBy: TaskObj.createdBy,
        //     latLongs: latLongs,
        //     location,
        //     comment
        // })

        // Update Agent's activeTask field
        if (newStatus === 'IN_TRANSIT') {
            let updatedAgent = await Agent.update({
                activeTask: taskID
            } , {
                where: {
                    ID: agentID,
                    TenantID: tenantHash
                },
                returning: true,
                plain: true
            })

        } else if (clockTerminationStatus.includes(newStatus)) {
            let updatedAgent = await Agent.update({
                activeTask: null
            }, {
                where: {
                    ID: agentID,
                    TenantID: tenantHash
                },
                returning: true,
                plain: true
            })

            // Find and Delete Invite Record
            const destroyedInvites = await TaskInvite.destroy({
                where: {
                    TaskID: taskID
                }
            })
            if(destroyedInvites > 0) {
                console.log(`Deleted ${destroyedInvites} invites, as new state (${newStatus}) is a termination state!`)
            }
        }

        const relations = {}
        relations.Team = await TaskObj.getTeam()
        relations.Agent = await TaskObj.getAgent()
        relations.TaskType = await TaskObj.getTaskType()

        TaskObj = { ...TaskObj.toJSON(), ...relations }
        // Task Invite to be sent again
        const status = TaskObj.taskStatus;
        if(status == "NOT_ASSIGNED") {
            let TaskObj1 = await Task.update({ taskInvite: "UNSENT" }, {
                where: {
                    TenantID: tenantHash,
                    ID: taskID
                },
                taskHistoryDisable: true,
            })
            let newTask = await Task.findOne({
                where: {
                    TenantID: tenantHash,
                    ID: taskID
                }
            })
            console.log("NEW TASK", newTask);
        }
        console.log('final task obj after update', JSON.stringify(TaskObj))

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
