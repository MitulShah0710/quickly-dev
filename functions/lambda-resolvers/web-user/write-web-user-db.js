const middy = require('middy');
const { requestFilter } = require('../../libs/utils');
const { middleware } = require("../sequelize-middleware");
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { WebUser, Team, WebUserTeams } } = models

    const { arguments, userID, tenantHash } = event
    const { info } = arguments
    const requiredFields = ["firstName", "lastName", "email", "userType"]
    const webUserObj = requestFilter(info, requiredFields)

    try {
        let newWebUser = await WebUser.create({
            ID: userID,
            TenantID: tenantHash,
            ...webUserObj
        })
        console.log('Web USer created!', newWebUser.toJSON())

        //adding teams relations
        if (info.TeamID && info.TeamID instanceof Array && info.TeamID.length > 0) {
            await newWebUser.addTeams(info.TeamID, { through: WebUserTeams })
        }

        const relations = {}
        relations.Teams = await newWebUser.getTeams()
        newWebUser = { ...relations, ...newWebUser.toJSON() }

        console.log('Final JSON webUser', JSON.stringify(newWebUser))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_USER_CREATED',
            log: newWebUser
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
        return newWebUser

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }