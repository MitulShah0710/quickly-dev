const middy = require('middy');
const { updateObjectProperty, requestFilter } = require('../../libs/utils');
const { middleware } = require("../sequelize-middleware");
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { AgentTeams, Agent, Team } } = models
    const { arguments, tenantHash } = event
    const { info, agentID } = arguments
    const requiredFields = ["firstName", "lastName", "status", "homeAddress", "homeLatLongs", "latitude", "longitude"]
    const agentUpdateObject = requestFilter(info, requiredFields)

    try {
        console.log('Update clause', agentUpdateObject)
        let updatedAgent = {}

        if (Object.keys(agentUpdateObject).length > 0) {
            updatedAgent = await Agent.update({
                ...agentUpdateObject,
            }, {
                where: {
                    ID: agentID,
                    TenantID: tenantHash
                },
                returning: true,
                plain: true
            })
            updatedAgent = updatedAgent[1]
            console.log('Agent updated!', updatedAgent.toJSON())
        } else {
            updatedAgent = await Agent.findOne({
                where: {
                    TenantID: tenantHash,
                    ID: agentID
                }
            })
            console.log('Agent not updated!', updatedAgent.toJSON())
        }

        if (info.TeamID && info.TeamID instanceof Array && info.TeamID.length > 0) {
            console.log('Teams available in update! updating AgentTeams table')
            await updatedAgent.setTeams(info.TeamID, { through: AgentTeams })

        } else if (info.TeamID && info.TeamID instanceof Array && info.TeamID.length === 0) {
            console.log('Blank teams provided, removing related teams from AgentTeams!')
            await updatedAgent.setTeams([], { through: AgentTeams })

        }

        const relations = {}
        relations.Teams = await updatedAgent.getTeams()
        updatedAgent = { ...updatedAgent.toJSON(), ...relations }

        console.log('Final Agent JSOn after updated!', JSON.stringify(updatedAgent))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_AGENT_UPDATED',
            log: updatedAgent
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

        return updatedAgent

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }