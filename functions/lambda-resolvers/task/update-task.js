const middy = require('middy');
const { middleware } = require("../sequelize-middleware");

// const handler = middy(async (event, context) => {
//     context.callbackWaitsForEmptyEventLoop = false
//     console.log('Incoming event', JSON.stringify(event))

//     const models = context.models
//     const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory } } = models

//     const { arguments } = event
//     const { taskID, rescheduleInput = false, taskDetailInput = false } = arguments
//     const { tenantHash } = event
//     const where = {
//         ID: taskID,
//         TenantID: tenantHash
//     }

//     const updateClause = {}
//     if (rescheduleInput) {
//         Object.keys(rescheduleInput).map(k => {
//             updateClause[k] = rescheduleInput[k]
//         })
//     }

//     if (taskDetailInput) {
//         Object.keys(taskDetailInput).map(k => {
//             updateClause[k] = taskDetailInput[k]
//         })
//     }

//     console.log('updateClause', JSON.stringify(updateClause))

//     try {
//         const task = await Task.update(updateClause, { where, returning: true, plain: true })
        
//         console.log('Task info', JSON.stringify(task))
//         return task[1].toJSON()

//     } catch (e) {
//         console.log('Error at query', JSON.stringify(e))
//         throw e
//     }
// })

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory } } = models

    const { arguments } = event
    const { taskID, updateFields = false, TaskUpdateInput = false } = arguments
    const { tenantHash } = event
    const where = {
        ID: taskID,
        TenantID: tenantHash
    }

    const updateClause = {}
    if (updateFields) {
        Object.keys(updateFields).map(k => {
            updateClause[k] = updateFields[k]
        })
    }

    if (TaskUpdateInput) {
        Object.keys(TaskUpdateInput).map(k => {
            updateClause[k] = TaskUpdateInput[k]
        })
    }

    console.log('updateClause', JSON.stringify(updateClause))

    try {
        const task = await Task.update(updateClause, { where, returning: true, plain: true, taskHistoryDisable: true })
        
        console.log('Task info', JSON.stringify(task))
        return task[1].toJSON()

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }