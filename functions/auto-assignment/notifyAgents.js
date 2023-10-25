'use strict';

const AppSync = require('aws-appsync')
const gql = require('graphql-tag')
const fetch = require('node-fetch')
const { env: { GQ_API_KEY, GQ_APP_URL, REGION } } = process

module.exports.handler = async (event, context) => {
    console.log(JSON.stringify(event));
    const { tenantHash } = event

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


    const mutation = gql`mutation CreateTaskInvite($taskID: String!, $agentID: [String!], $teamID: String, $tenantID: String!) {
        createTaskTenantInvite(taskID: $taskID, agentID: $agentID, teamID: $teamID, tenantID:$tenantID) {
            ID
            agentID
            TaskID
            Task{
                ID
                AgentID
                TeamID
                taskType
                taskMode
                priority
                value
                completedOn
                ratingByAgent
                commentsByAgent
                customerName
                customerEmail
                customerPhone
                customerAddress
                customerLatLongs{
                    lat
                    long
                }
                taskDescription
                taskStatus
                pickupName
                pickupAddress
                pickupLatLongs{
                    lat
                    long
                }
                TaskTypeID
                TaskType{
                    ID
                    name
                }
                deliveryAddress
                deliveryPhoto
                deliverySignature
                createdBy
                createdAt
                updatedBy
                updatedAt
                plannedDate
                origin
                executor
                serviceTime
                visitDate
                visitTimeWindow
                isCompeted
                weight
                additionalInfo
            }
        }
    }`

    console.log('Calling createTaskTenantInvite mutation')
    const result = await appSyncClient.mutate({
        mutation,
        variables: {
            taskID: event.task.id,
            agentID: event.current.selectedAgents,
            teamID:event.task.teamId,
            tenantID:tenantHash
        }
    }).catch(e => {
        console.log('Error at graphql', JSON.stringify(e))
        throw e
    })

    console.log('results createTaskTenantInvite ', JSON.stringify(result))

    let newlyNotifiedAgents = result.data.createTaskTenantInvite.agentID
    let currentTaskStatus = result.data.createTaskTenantInvite.Task.taskStatus

    if (newlyNotifiedAgents && newlyNotifiedAgents.length > 0 && currentTaskStatus === "NOT_ASSIGNED") {
        const mutation = gql`mutation UpdateTaskStatusByUser($taskID: String!, $newStatus: TaskStatus!, $comment: String, $tenantID: String) {
            updateTaskStatusByUser(taskID: $taskID, newStatus: $newStatus, comment: $comment, tenantID: $tenantID) {
                ID
                AgentID
                TeamID
                taskStatus
                plannedDate
                taskMode
                TaskType {
                    ID
                    name
                }
                TaskTypeID
            }
        }`

        console.log('Calling updateTaskStatusByUser mutation')
        const result2 = await appSyncClient.mutate({
            mutation,
            variables: {
                taskID: event.task.id,
                newStatus: 'PENDING_ACCEPTANCE',
                comment: 'Set by auto-assignment function',
                tenantID: tenantHash
            }
        }).catch(e => {
            console.log('Error at graphql updating Task status', JSON.stringify(e))
            throw e
        })
    }

    return {
        'selectedAgents': event.current.selectedAgents,
        'numSelectedAgents': event.current.numSelectedAgents,
        'notifiedAgents': event.current.notifiedAgents.concat(newlyNotifiedAgents),
        'attempts': event.current.attempts
    };

};
