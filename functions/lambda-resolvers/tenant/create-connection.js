const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: {Tenant, TenantConnection} } = models

    const { tenantHash, arguments, user } = event
    const { email } = arguments

    try {
        const destTenantDetails = await Tenant.findOne({
            where: {
                tenantAdminEmail: email
            }
        })
        console.log('Dest Tenant info', JSON.stringify(destTenantDetails))

        const sourceTenantDetails = await Tenant.findOne({
            where: {
                ID: tenantHash
            }
        })
        console.log('Source Tenant info', JSON.stringify(sourceTenantDetails))

        if (!destTenantDetails) {
            throw new Error("No Tenant found with given email!")
        }

        const connectionRequest = await TenantConnection.create({
            sourceTenantID: tenantHash,
            destTenantID: destTenantDetails.ID,
            createdBy: user,
        })
        // await pinpointSendMessage([destTenantDetails.tenantAdminEmail], 'New Connection Request', temp.replace(/{{sourceTenant}}/g, destTenantDetails.tenantAdminEmail))
        connectionRequest.name = destTenantDetails.name
        connectionRequest.tenantAdminEmail = destTenantDetails.tenantAdminEmail
        
        return connectionRequest

    } catch (e) {
        console.log('error at query', e)
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }