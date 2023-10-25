const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: {Tenant, TenantConnection} } = models

    const { tenantHash, arguments, user } = event
    const { requestID, newStatus } = arguments

    try {
        const connectionDetails = await TenantConnection.findOne({
            where: {
                ID: requestID,
                destTenantID: tenantHash
            },
            include: { model: Tenant, as: 'DestTenant', attributes: [ 'tenantAdminEmail', 'name', 'tenantAdminName' ]}
        })
        console.log('connection Details', JSON.stringify(connectionDetails))

        if (!connectionDetails) {
            throw new Error("No connection found with given id!")
        }
        
        connectionDetails.status = newStatus
        await connectionDetails.save()
        
        let responseObj = connectionDetails.toJSON()
        console.log('response obj', responseObj)
        
        responseObj = {...responseObj, ...responseObj.destTenant }
        delete responseObj.destTenant
        
        return  responseObj
    } catch (e) {
        console.log('error at query', e)
        throw e
    }
    
    
})

handler.use({
    before: middleware
})


module.exports = { handler }