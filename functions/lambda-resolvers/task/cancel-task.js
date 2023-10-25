const AWS = require('aws-sdk')
const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils')
const axios = require('axios')
const lambda = new AWS.Lambda()
const { env: { NOTIFICATION_SENDER_LAMBDA, PRIVATE_API_ENDPOINT } } = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { taskID } = arguments
    const validCancelStates = ["INVALID_LOCATION", "NOT_ASSIGNED", "PENDING_ACCEPTANCE", "ACCEPTED", "ASSIGNED"]


    //task model building
    try {
        let oldTask = await Task.findOne({
            where: {
                TenantID: tenantHash,
                ID: taskID
            }
        })

        console.log('task details', oldTask.toJSON())
        if (oldTask && !validCancelStates.includes(oldTask.taskStatus)) {
            console.log(`Task can not be cancelled when is ${oldTask.taskStatus}`)
            throw new Error(`Task can not be cancelled when is ${oldTask.taskStatus}`)
        }
        let TaskObj = await Task.update({ updatedBy: requesterUser, taskStatus: "CANCELLED" }, {
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