const middy = require('middy')
const { updateObjectProperty } = require('../../libs/utils')
const { middleware } = require("../sequelize-middleware");
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Team } = models

    const { tenantHash } = event
    const { arguments } = event
    const { teamID } = arguments

    // return true
    try {
        let teamInfo = await Team.destroy({
            where: {
                ID: teamID,
                TenantID: tenantHash
            }
        })

        console.log('Delete status', teamInfo)
        if (teamInfo > 0) {
            await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
                action: 'TENANT_TEAM_DELETED',
                log: {
                    teamID,
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
                action: 'TENANT_TEAM_DELETED',
                log: {
                    teamID,
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