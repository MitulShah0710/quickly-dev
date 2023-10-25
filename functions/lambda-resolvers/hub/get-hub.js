const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Hub, Team } = models

    const { tenantHash, arguments } = event
    const { hubId } = arguments

    try {
        const HubInfo = await Hub.findOne({
            where: {
                ID: hubId,
                TenantID: tenantHash
            },
            include: { model: Team }
        })

        console.log('tenant info', JSON.stringify(HubInfo))

        if (!HubInfo) {
            console.log('no hub found')
            throw new Error('No hub with the provided ID!')
        }

        return HubInfo

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }