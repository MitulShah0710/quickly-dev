const axios = require('axios');
const middy = require('middy')
const { updateObjectProperty } = require('../../libs/utils')
const { middleware } = require("../sequelize-middleware");
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Location } = models

    const { tenantHash, arguments, requesterUser } = event
    const { locationId, info } = arguments

    try {
        let LocationInfo = await Location.findOne({
            where: {
                ID: locationId,
                TenantID: tenantHash
            }
        })

        if (!LocationInfo) {
            console.log('Invalid request found! NO location for the specific ID!')
            throw new Error('Invalid location ID!')
        }

        // Sanitize names: remove extra white spaces and use consistent case
        if ('name' in info) {
            info.name = info.name.trim().replace(/\s{2,}/g, ' ').toLowerCase().replace(/(^\w)|(\s\w)/g, match => match.toUpperCase());
        }

        // Sanitize phone: remove white spaces
        if ('phone' in info) {
            info.phone = info.phone.replace(/\s+/g, '')
        }

        //dynamically handle optional update properties
        LocationInfo = updateObjectProperty(info, LocationInfo)
        console.log('location info', LocationInfo)

        //manage updating user
        LocationInfo.updatedBy = requesterUser

        //saving update
        await LocationInfo.save();
        await LocationInfo.reload()

        console.log('Updated Location info', JSON.stringify(LocationInfo))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_LOCATION_UPDATED',
            log: LocationInfo
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
        return LocationInfo

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }