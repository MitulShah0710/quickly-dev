const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Tenant } = models

    const { tenantHash } = event
    try {
        const tenantInfo = await Tenant.findOne({
            where: { 
                ID: tenantHash 
            }
        })

        console.log('tenant info', JSON.stringify(tenantInfo))
        return tenantInfo 
    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }