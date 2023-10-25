const middy = require('middy')
const { middleware } = require("../lambda-resolvers/sequelize-middleware");
const { sendResponse } = require('../libs/api-gateway-libs')
const { Op, Sequelize } = require('sequelize')

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Tenant, Task, TaskHistory } } = models
    const apiKey = event.requestContext.identity.apiKey
    const taskID = (event.pathParameters && 'id' in event.pathParameters) ? event.pathParameters.id : null
    const offset = (event.queryStringParameters && 'offset' in event.queryStringParameters) ? event.queryStringParameters.offset : 0
    const limit = (event.queryStringParameters && 'limit' in event.queryStringParameters) ? event.queryStringParameters.limit : 10
    const dateField = (event.pathParameters && 'dateField' in event.pathParameters) ? event.pathParameters.dateField : null
    const from = (event.pathParameters && 'from' in event.pathParameters) ? event.pathParameters.from : null
    const to = (event.pathParameters && 'to' in event.pathParameters) ? event.pathParameters.to : null

    try {
        // Get Tenant Hash for provided API key
        const tenant = await Tenant.findOne({
            where: {
                apiKeyValue: apiKey
            },
            attributes: ['ID', 'name', 'status', 'ON_HOLD']
        })

        if (tenant.status === 'ACTIVE' && !tenant.ON_HOLD) {
            if (taskID) {
                const task = await Task.findOne({
                    where: {
                        TenantID: tenant.ID,
                        ID: taskID
                    },
                    include: [
                        {
                            model: TaskHistory,
                            order: ['createdAt', 'DESC'],
                            attributes: ['timestamp', 'status', 'comment', 'latLongs', 'changedBy']
                        }
                    ],
                    attributes: {
                        exclude: ['origin', 'executor', 'TenantID']
                    },
                    order: [
                        [{ model: TaskHistory }, 'createdAt', 'DESC' ]
                    ]
                })

                return sendResponse(200, {
                    Status: 'OK',
                    tasks: [task],
                    count: 1,
                    total: 1
                })

            } else {
                const where = {
                    TenantID: tenant.ID
                }

                if (dateField && from && to) {
                    where[dateField] = { [Op.between]: [from, to] }
                }

                const { rows, count } = await Task.findAndCountAll({
                    where,
                    include: [
                        {
                            model: TaskHistory,
                            order: ['createdAt', 'DESC'],
                            attributes: ['timestamp', 'status', 'comment', 'latLongs', 'changedBy']
                        }
                    ],
                    attributes: {
                        exclude: ['origin', 'executor', 'TenantID']
                    },
                    distinct: true,
                    limit,
                    offset,
                    order: [
                        [{ model: TaskHistory }, 'createdAt', 'DESC' ],
                        ['updatedAt', 'DESC']
                    ]
                })

                return sendResponse(200, {
                    Status: 'OK',
                    tasks: rows,
                    count: rows.length,
                    total: count
                })

            }

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
