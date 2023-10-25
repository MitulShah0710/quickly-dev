const middy = require('middy')
const { middleware } = require("../lambda-resolvers/sequelize-middleware");
const { sendResponse } = require('../libs/api-gateway-libs')

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Tenant, Team } } = models
    const apiKey = event.requestContext.identity.apiKey
    const teamId = (event.pathParameters && 'id' in event.pathParameters) ? event.pathParameters.id : null
    const offset = (event.queryStringParameters && 'offset' in event.queryStringParameters) ? event.queryStringParameters.offset : 0
    const limit = (event.queryStringParameters && 'limit' in event.queryStringParameters) ? event.queryStringParameters.limit : 10

    try {
        // Get Tenant Hash for provided API key
        const tenant = await Tenant.findOne({
            where: {
                apiKeyValue: apiKey
            },
            attributes: ['ID', 'name', 'status', 'ON_HOLD']
        })

        if (tenant.status === 'ACTIVE' && !tenant.ON_HOLD) {
            if (teamId) {
                const teamInfo = await Team.findOne({
                    where: {
                        ID: teamId,
                        TenantID: tenant.ID
                    },
                    attributes: {
                        exclude: ['TenantID']
                    }
                })

                return sendResponse(200, {
                    Status: 'OK',
                    teams: [teamInfo],
                    count: 1,
                    total: 1
                })

            } else {
                const { rows, count } = await Team.findAndCountAll({
                    where: {
                        TenantID: tenant.ID
                    },
                    attributes: {
                        exclude: ['TenantID']
                    },
                    limit,
                    offset
                })

                return sendResponse(200, {
                    Status: 'OK',
                    teams: rows,
                    count,
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
