const middy = require('middy');
const { updateObjectProperty, requestFilter } = require('../../libs/utils');
const { middleware } = require("../sequelize-middleware");
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { WebUser, Team, WebUserTeams } } = models
    const { arguments, tenantHash } = event
    const { info, userID } = arguments

    const requiredFields = ["firstName", "lastName", "status"]
    const webUserUpdateObj = requestFilter(info, requiredFields)

    try {
        console.log('WebUser update request -> ', JSON.stringify(webUserUpdateObj))
        let updatedWebUser = {}

        if (Object.keys(webUserUpdateObj).length > 0) {
            updatedWebUser = await WebUser.update({
                ...webUserUpdateObj
            }, {
                where: {
                    ID: userID,
                    TenantID: tenantHash
                },
                returning: true,
                plain: true
            })

            updatedWebUser = updatedWebUser[1]
            console.log('Web User updated!', updatedWebUser.toJSON())
        } else {
            updatedWebUser = await WebUser.findOne({
                where: {
                    ID: userID,
                    TenantID: tenantHash
                }
            })
            console.log('Web user is not updated!', updatedWebUser.toJSON())
        }

        if (info.TeamID && info.TeamID instanceof Array && info.TeamID.length > 0) {
            console.log('Teams available in update! updating WebUserTeams table')
            await updatedWebUser.setTeams(info.TeamID, { through: WebUserTeams })

        } else if (info.TeamID && info.TeamID instanceof Array && info.TeamID.length === 0) {
            console.log('Blank teams provided, removing related teams from WebUserTeams!')
            await updatedWebUser.setTeams([], { through: WebUserTeams })

        }

        const relations = {}
        relations.Teams = await updatedWebUser.getTeams()
        updatedWebUser = { ...updatedWebUser.toJSON(), ...relations }

        console.log('Final WebUSer after updated!', JSON.stringify(updatedWebUser))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_USER_UPDATED',
            log: updatedWebUser
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
        return updatedWebUser

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }