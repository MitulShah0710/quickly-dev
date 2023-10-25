const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Location } = models

    const { arguments, requesterUser, tenantHash } = event
    const { info } = arguments

    // Sanitize names: remove extra white spaces and use consistent case
    if ('name' in info) {
        info.name = info.name.trim().replace(/\s{2,}/g, ' ').toLowerCase().replace(/(^\w)|(\s\w)/g, match => match.toUpperCase());
    }

    // Sanitize phone: remove white spaces
    if ('phone' in info) {
        info.phone = info.phone.replace(/\s+/g, '')
    }

    try {
        let newLocation = new Location({
            TenantID: tenantHash,
            ...info,
            createdBy: requesterUser
        })

        newLocation = await newLocation.save()
        console.log('Location create complete! Location data -> ', JSON.stringify(newLocation))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_LOCATION_CREATED',
            log: newLocation
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

        return newLocation

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }