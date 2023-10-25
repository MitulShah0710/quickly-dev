const middy = require('middy')
const { updateObjectProperty } = require('../../libs/utils')
const { middleware } = require("../sequelize-middleware");
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Hub } = models

    const { tenantHash, arguments } = event
    const { hubId } = arguments

    // return true;
    try {
        let HubInfo = await Hub.destroy({
            where: {
                ID: hubId,
                TenantID: tenantHash
            }
        })

        console.log('Delete hub status', HubInfo)
        if (HubInfo > 0) {
            await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
                action: 'TENANT_HUB_DELETED',
                log: {
                    hubId,
                    deleted: true
                }
            }, {
                headers: {
                    'InvocationType': 'Event'
                }
            })
                .then(function (response) {
                    console.log('axios response', response);
                })
                .catch(function (error) {
                    console.log('axios error', error);
                });
            return true
        } else {
            await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
                action: 'TENANT_HUB_DELETED',
                log: {
                    hubId,
                    deleted: false
                }
            }, {
                headers: {
                    'InvocationType': 'Event'
                }
            })
                .then(function (response) {
                    console.log('axios response', response);
                })
                .catch(function (error) {
                    console.log('axios error', error);
                });
            return false
        }

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }