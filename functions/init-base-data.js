const middy = require('middy')
const { middleware } = require('./lambda-resolvers/sequelize-middleware')

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Hub, Tenant, Team, WebUser } = models

    try {

        //creating base tenant
        let tenant = new Tenant({
            ID: event.id,
            name: event.businessName,
            tenantAdminName: `${event.contactFirstName} ${event.contactLastName}`,
            tenantAdminEmail: event.contactEmail,
            status: 'ACTIVE',
            quicklyNetworkEnabled: true,
            createdBy: 'SYSTEM',
            country: event.country,
            // phone: ''
            address: event.address,
            zipCode: event.zipCode,
            typeOfBusiness: event.typeOfBusiness,
            averageDrivers: event.averageDrivers,
            averageMonthlyOrders: event.averageMonthlyOrders,
            apiKeyId: event.apiKeyId,
            apiKeyValue: event.apiKeyValue
        })
        tenant = await tenant.save()
        console.log(`${tenant.ID} is saved!`)

        //creating the default hub
        let hub = new Hub({
            TenantID: event.id,
            name: `HUB-${event.businessName}`,
            createdBy: 'SYSTEM',
            address: ''
        })
        hub = await hub.save()
        console.log(`HUB ${hub.TenantID} saved!`)

        //creating the default team
        let team = new Team({
            TenantID: event.id,
            HubID: hub.ID,
            name: `TEAM-${event.businessName}`,
            createdBy: 'SYSTEM'
        });
        team = await team.save();
        console.log(team.ID);

        let newWebUser = new WebUser({
            TenantID: event.id,
            ID: event.userId,
            firstName: event.contactFirstName,
            lastName: event.contactLastName,
            email: event.contactEmail,
            status: 'ACTIVE',
            isVerified: true,
            userType: 'TENANT_ADMIN',
            // TeamID: team.ID
        })
        newWebUser = await newWebUser.save()
        console.log('Admin web user created in DB!')

    } catch (e) {
        console.log('Error at storing records!', JSON.stringify(e))
    }

    return
})

handler.use({
    before: middleware
})


module.exports = { handler }
