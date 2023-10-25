const axios = require('axios');
const middy = require('middy')
const { updateObjectProperty } = require('../../libs/utils')
const { middleware } = require("../sequelize-middleware");
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Hub } = models

    const { tenantHash, arguments, requesterUser } = event
    const { hubId, info } = arguments

    try {
        let HubInfo = await Hub.findOne({
            where: {
                ID: hubId,
                TenantID: tenantHash
            }
        })

        if (!HubInfo) {
            console.log('Invalid request found! NO tenant for the specific ID!')
            throw new Error('Invalid hub ID!')
        }

        //dynamically handle optional update properties 
        HubInfo = updateObjectProperty(info, HubInfo)
        console.log('hub info', HubInfo)

        //manage updating user
        HubInfo.updatedBy = requesterUser
        
        //saving update
        await HubInfo.save();
        await HubInfo.reload()

        HubInfo.Teams = await HubInfo.getTeams()
        console.log('Updated Hub info', JSON.stringify(HubInfo))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_HUB_UPDATED',
            log: HubInfo
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
        return HubInfo

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }