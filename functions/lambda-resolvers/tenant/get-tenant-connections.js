const { Op } = require("sequelize");
const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Tenant, TenantConnection } = models

    const { tenantHash } = event
    const { arguments, user } = event

    try {
        const tenantConnections = await TenantConnection.findAll({
            where: {
                [Op.or]: [
                    { sourceTenantID: tenantHash },
                    { destTenantID: tenantHash },
                ]
            },
            include: [{ model: Tenant, as: 'DestTenant', attributes: ['tenantAdminEmail', 'name', 'tenantAdminName'] },
            { model: Tenant, as: 'SourceTenant', attributes: ['tenantAdminEmail', 'name', 'tenantAdminName'] }]
        })
        console.log('Tenant connections', JSON.stringify(tenantConnections))

        if (!tenantConnections || !tenantConnections.length) {
            return { sent: [], received: [] }
        }

        const response = {
            sent: [],
            received: []
        }

        tenantConnections.map(e => {
            if (e.sourceTenantID === tenantHash) {
                response.sent.push({
                    ID: e.ID,
                    name: e.DestTenant.name,
                    tenantAdminName: e.DestTenant.tenantAdminName,
                    tenantAdminEmail: e.DestTenant.tenantAdminEmail,
                    status: e.status
                })
            } else if (e.destTenantID === tenantHash) {
                response.received.push({
                    ID: e.ID,
                    name: e.SourceTenant.name,
                    tenantAdminName: e.SourceTenant.tenantAdminName,
                    tenantAdminEmail: e.SourceTenant.tenantAdminEmail,
                    status: e.status
                })
            }
        })


        console.log('Tenant connections', JSON.stringify(response))
        return response

    } catch (e) {
        console.log('error at query', e)
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }