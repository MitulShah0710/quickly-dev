const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const axios = require('axios');
const AppSync = require('aws-appsync')
const gql = require('graphql-tag')
const fetch = require('node-fetch')
const { env: { PRIVATE_API_ENDPOINT, GQ_APP_URL, GQ_API_KEY, REGION } } = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType, TaskInvite } } = models
    const { arguments, requesterUser, tenantHash, requester_jwt } = event
    let { taskID, agentID } = arguments

    try {
        const task = await Task.findOne({
            where: {
                ID: taskID,
                TenantID: tenantHash
            }
        })
        const invite = task.taskInvite;
        const status = task.taskStatus;
        if(status != "NOT_ASSIGNED" && status != "PENDING_ACCEPTANCE" )
        {
            throw `Task already ${status}`
        }
        else {
            let taskInvite;
            const associations = {}
            if(invite == 'UNSENT')   // TODO: Need to review this, since same task can get multiple invites
            {
                taskInvite = await TaskInvite.create({
                    TaskID: taskID,
                    agentID,
                    createdBy: requesterUser,
                    TenantID: tenantHash,
                })
                let task = await taskInvite.getTask()
                // Rest of the Code
                associations.Team = await task.getTeam()
                associations.Agent = await task.getAgent()
                associations.TaskType = await task.getTaskType()
                associations.TaskHistories = await task.getTaskHistories()
                console.log('Complete object', JSON.stringify({ ...taskInvite, Task: { ...task.toJSON(), ...associations } }))
                console.log("STATUS CHANGED");
                await Task.update({
                    taskInvite: "SENT"
                }, {
                    where: {
                        ID: taskID,
                        TenantID: tenantHash,
                    }, 
                    taskHistoryDisable: true,
                })
            }
            else {

                // Filtering out agents who have rejected previous agents
                taskInvite = await TaskInvite.findOne({
                    where: {
                        TaskID: taskID
                    }
                });

                if(status !== 'NOT_ASSIGNED') {
                    if(!taskInvite.rejectedBy) {
                        taskInvite.rejectedBy = [];
                    }

                    agentID = agentID.filter(agent => !taskInvite.rejectedBy.includes(agent));

                    if(agentID.length === 0) {
                        throw 'All agents have rejected invite'
                    }
                }

                // If taskInvite is already sent then it will override the TaskInvite object
                taskInvite = await TaskInvite.update({
                    agentID: agentID
                }, {
                    where: {
                        TaskID: taskID
                    },
                    returning: true,
                    plain: true
                });

                // index 0 for no of rows affected, index 1 for data
                taskInvite = taskInvite[1];
                
                associations.Team = await task.getTeam()
                associations.Agent = await task.getAgent()
                associations.TaskType = await task.getTaskType()
                associations.TaskHistories = await task.getTaskHistories()
                console.log('Complete object', JSON.stringify({ ...taskInvite, Task: { ...task.toJSON(), ...associations } }))
            }

            await axios.post(`${PRIVATE_API_ENDPOINT}/send-push`, {
                notification: {
                    title: 'New Task invite!',
                    data: `${taskID}`,
                    body: task.dataValues.taskDescription,
                    sound: 'default'
                },
                to: agentID
            })
            .then(async (response) => {
                console.log('axios response', response);
                // Update Task Status
                // await Task.update({
                    //     taskStatus: 'PENDING_ACCEPTANCE',
                    //     updatedBy: requesterUser,
                    //     taskInvite: "SENT"
                    // }, {
                        //     where: {
                            //         TenantID: tenantHash,
                            //         ID: taskID,
                            //         taskStatus: {
                                //             [Op.or]: ['NOT_ASSIGNED', 'PENDING_ACCEPTANCE']
                                //         }
                                //     }
                                // })

                    })
                .catch(function (error) {
                    console.log('axios error', error);
                });
                return { ...taskInvite.dataValues, Task: { ...task.toJSON(), ...associations } }
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
