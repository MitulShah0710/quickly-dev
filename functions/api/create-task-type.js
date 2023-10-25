const middy = require('middy')
const { middleware } = require("../lambda-resolvers/sequelize-middleware");
const { sendResponse } = require('../libs/api-gateway-libs')

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Tenant, TaskType } } = models
    const apiKey = event.requestContext.identity.apiKey
    const requesterUser = 'API'
    let createTaskTypesPromises = []

    try {
        // Get Tenant Hash for provided API key
        const tenant = await Tenant.findOne({
            where: {
                apiKeyValue: apiKey
            },
            attributes: ['ID', 'name', 'status', 'ON_HOLD']
        })

        if (tenant.status === 'ACTIVE' && !tenant.ON_HOLD) {
            JSON.parse(event.body).tasksTypes.forEach(element => {
                let items = element.items.map(i => `${i.code} - ${i.item}`)
                createTaskTypesPromises.push(
                    TaskType.create({
                        name: element.name,
                        isDelivery: element.isDelivery,
                        createdBy: requesterUser,
                        TenantID: tenant.ID,
                        items: items
                    })
                )
            })

            const newTasksTypes = await Promise.all(createTaskTypesPromises)
            console.log(`${newTasksTypes.length} taskTypes created`);
            console.log('newTasksTypes', JSON.stringify(newTasksTypes));
            // console.log(JSON.stringify(newTasks))
            const newTasksTypesIds = newTasksTypes.map(t =>  ({ID: t.ID, name: t.name, items: t.items}) )
            return sendResponse(200, {
                Status: 'OK',
                TaskTypes: newTasksTypesIds
            })

        } else {
            return sendResponse(400, { Error: 'Tenant is not ACTIVE or the account is ON_HOLD' })
        }


    } catch (e) {
        console.error("Exception processing the request", JSON.stringify(e))
        return sendResponse(500, { Error: 'Exception processing the request' })
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
