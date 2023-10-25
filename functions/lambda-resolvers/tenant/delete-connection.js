const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Tenant, TenantConnection } = models

    const { tenantHash } = event
    const { arguments, user } = event
    const { requestID, newStatus } = arguments

    try {
        const connectionDetails = await TenantConnection.destroy({
            where: {
                ID: requestID,
                sourceTenantID: tenantHash
            },
            include: { model: Tenant, as: 'destTenant', attributes: [ 'tenantAdminEmail', 'name', 'tenantAdminName' ]}
        })
        console.log('connection deleted', connectionDetails)
        if( connectionDetails > 0) {
            return true
        } else {
            return false
        }
        
    } catch (e) {
        console.log('error at query', e)
        throw e
    }
    
    
})

handler.use({
    before: middleware
})


module.exports = { handler }