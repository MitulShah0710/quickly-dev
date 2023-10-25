const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Tenant } } = models
    const { where, update } = event

    try {
        const tenantInfo = await Tenant.update({
            ...update
        }, {
            where,
            returning: true,
            plain: true
        })

        console.log('UPdate results', tenantInfo, tenantInfo[1].toJSON())
        return true
    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }