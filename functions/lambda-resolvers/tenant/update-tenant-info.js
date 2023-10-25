const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Tenant } } = models
    const { arguments, tenantHash, requesterUser } = event
    const { updateInfo: { configs = false } } = arguments

    const updateClause = {}
    if(configs) {
        // updateClause.configs = JSON.parse(configs)
        updateClause.configs = configs
    }

    try {
        const tenantInfo = await Tenant.update(updateClause, {
            where: {
                ID: tenantHash
            },
            returning: true,
            plain: true
        })

        console.log('UPdate results', tenantInfo, tenantInfo[1].toJSON())
        return tenantInfo[1].toJSON()

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }