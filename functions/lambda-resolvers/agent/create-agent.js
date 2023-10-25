const middy = require('middy');
const { requestFilter } = require('../../libs/utils');
const { middleware } = require("../sequelize-middleware");
const axios = require('axios');
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Agent, Team, AgentTeams } } = models

    const { arguments, tenantHash, user } = event
    const { info } = arguments

    try {
        const requiredFields = [ 'email', 'firstName', 'lastName', 'homeAddress', 'homeLatLongs', 'latitude', 'longitude' ]
        const agentObject = requestFilter(info, requiredFields)

        let newAgent = await Agent.create({
            ID: user,
            ...agentObject,
            createdBy: user,
            TenantID: tenantHash,
        })
        console.log('Agent created', JSON.stringify(newAgent))

        //adding teams relations
        if (info.TeamID && info.TeamID instanceof Array && info.TeamID.length > 0) {
            await newAgent.addTeams(info.TeamID, { through: AgentTeams })
        }

        const AgentRelations = {}
        AgentRelations.Teams = await newAgent.getTeams()
        newAgent = { ...AgentRelations, ...newAgent.toJSON() }

        console.log('Final Agent response', JSON.stringify(newAgent))
        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_AGENT_CREATED',
            log: newAgent
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

        return newAgent

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
