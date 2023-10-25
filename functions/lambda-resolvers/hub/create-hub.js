const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Hub } = models

    const { arguments, requesterUser, tenantHash } = event
    const { info } = arguments

    try {
        let newHub = new Hub({
            TenantID: tenantHash,
            ...info,
            createdBy: requesterUser
        })

        newHub = await newHub.save()
        console.log('Hub create complete! hub data -> ', JSON.stringify(newHub))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_HUB_CREATED',
            log: newHub
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

        return newHub

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }