const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Location, Team } = models

    const { tenantHash, arguments } = event
    const { locationId } = arguments

    try {
        const LocationInfo = await Location.findOne({
            where: {
                ID: locationId,
                TenantID: tenantHash
            }
        })

        console.log('tenant info', JSON.stringify(LocationInfo))

        if (!LocationInfo) {
            console.log('no location found')
            throw new Error('No location with the provided ID!')
        }

        return LocationInfo

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }