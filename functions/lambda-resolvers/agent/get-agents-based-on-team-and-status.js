const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Agent, Team } = models

    const { tenantHash, arguments } = event
    const { teamID, status } = arguments

    try {
        const { rows, count } = await Team.findAndCountAll({
            where: {
                TenantID: tenantHash,
                ID: teamID
            },
            include: {
                model: Agent,
                where: {
                    workStatus: status
                }
            }
        })

        console.log('Tenant info', JSON.stringify(rows))
        if (!rows || !rows.length) {
            return {
                agents: [],
                count: 0
            }
        }

        return {
            agents: rows[0].Agents,
            count: count
        }

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }