const AWS = require('aws-sdk')
const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils')
const axios = require('axios')
const lambda = new AWS.Lambda()
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskInvite } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { taskID, agentID } = arguments

    //task model building
    try {
        let oldTask = await Task.findOne({
            where: {
                TenantID: tenantHash,
                ID: taskID
            }
        })
        const status = oldTask.dataValues.taskStatus;
        if(status == "ASSIGNED" || status == "ON_SITE" || status == "IN_TRANSIT" || status == "PARTIALLY_COMPLETED" || status == "COMPLETED")
        {
            throw `Task already ${status}`
        }
        else
        {
            let taskTeam = await oldTask.getTeam()
            if (!taskTeam) {
                console.log('No team assigned!, operation blocks')
                throw new Error('First completes the team assignment!')
            }

            let TaskObj = await Task.update({ AgentID: agentID, updatedBy: requesterUser, taskStatus: "ASSIGNED" }, {
                where: {
                    TenantID: tenantHash,
                    ID: taskID
                },
                returning: true,
            })

            console.log('Update result', TaskObj)
            TaskObj = TaskObj[1][0];

            // await TaskHistory.create({
            //     TenantID: tenantHash,
            //     TaskID: TaskObj.ID,
            //     // timestamp: new Date().getTime(),
            //     status: TaskObj.taskStatus,
            //     changedBy: TaskObj.createdBy
            // })

            const relations = {}
            relations.Team = await TaskObj.getTeam()
            relations.Agent = await TaskObj.getAgent()

            TaskObj = { ...TaskObj.toJSON(), ...relations }
            console.log('final task obj after update', JSON.stringify(TaskObj))

            await axios.post(`${PRIVATE_API_ENDPOINT}/send-push`, {
                notification: {
                    title: 'New Task Assigned!',
                    data: `${taskID}`,
                    body: TaskObj.taskDescription,
                    sound: 'default'
                },
                to: [agentID]
            })
                .then(function (response) {
                    console.log('axios response', response);
                })
                .catch(function (error) {
                    console.log('axios error', error);
                });

            const taskInvite = await TaskInvite.findOne({
                where: {
                        TaskID: taskID}
                });

            if(taskInvite !== null) {
                await TaskInvite.destroy({
                    where: {
                        ID: taskInvite.ID
                    }
                })
                console.log('Invite deleted!')
            }
            // await lambda.invokeAsync({
            //     FunctionName: NOTIFICATION_SENDER_LAMBDA,
                // InvokeArgs: JSON.stringify({
                //     notification: {
                //         title: 'New Task Assigned!',
                //         data: `${taskID}`
                //     },
                //     to: [agentID]
                // })
            // }).promise()

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
