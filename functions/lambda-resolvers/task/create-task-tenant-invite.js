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
    const { arguments } = event
    const { taskID, agentID, tenantID, teamID } = arguments

    try {
        let newTaskInvite = await TaskInvite.create({
            TaskID: taskID,
            agentID,
            createdBy: 'STEP_FUNCTION',
            TenantID: tenantID,
        })

        let task = await newTaskInvite.getTask()
        const associations = {}
        associations.Team = await task.getTeam()
        associations.Agent = await task.getAgent()
        associations.TaskType = await task.getTaskType()
        associations.TaskHistories = await task.getTaskHistories()
        console.log('Complete object', JSON.stringify({ ...newTaskInvite.toJSON(), Task: { ...task.toJSON(), ...associations } }))

        // const agentsEmails = await Promise.all(agentID.map(async agent => {
        //     const temp = await Agent.findOne({
        //         where: {
        //             ID: agent
        //         }
        //     })

        //     return temp.email
        // }))

        await axios.post(`${PRIVATE_API_ENDPOINT}/send-push`, {
            notification: {
                title: 'New Task Assigned!',
                data: `${taskID}`
            },
            to: agentID
        })
            .then(async (response) => {
                console.log('axios response', response);
                // Update task Status
                if (!globalThis.fetch) globalThis.fetch = fetch
                const appSyncClient = new AppSync.AWSAppSyncClient({
                    url: GQ_APP_URL,
                    region: REGION,
                    auth: {
                        type: 'API_KEY',
                        apiKey: GQ_API_KEY

                    },
                    disableOffline: true
                })

            })
            .catch(function (error) {
                console.log('axios error', error);
            });


        return { ...newTaskInvite.toJSON(), Task: { ...task.toJSON(), ...associations } }

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
