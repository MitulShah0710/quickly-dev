const middy = require('middy')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils')
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process
//function will filter request
//returns base model with static properties
//optionally returns dynamic object with optional properties 


const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const requiredFields = ['name', 'autoAssignment', 'minCoverageRadius', 'maxCoverageRadius']
    const models = context.models
    const { models: { Team, WebUserTeams, AgentTeams } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { info } = arguments
    try {

        const teamObject = requestFilter(info, requiredFields)
        console.log('After filter team object', JSON.stringify(teamObject))

        //creating basic team object 
        teamObject.HubID = info.HubID
        let newTeam = await Team.create({
            ...teamObject,
            TenantID: tenantHash,
            createdBy: requesterUser
        })

        //checking for relationships to WebUsers
        if (info.webUsers && info.webUsers instanceof Array && info.webUsers.length > 0) {
            console.log('Web users are provided in request, creating entries in WebUserTeams!')
            await Promise.all(info.webUsers.map(async webUser => {
                return WebUserTeams.create({
                    WebUserID: webUser,
                    TeamID: newTeam.ID
                })
            }))
        }

        //checking for relationships to Agents
        if (info.agents && info.agents instanceof Array && info.agents.length > 0) {
            await Promise.all(info.agents.map(async agent => {
                return AgentTeams.create({
                    AgentID: agent,
                    TeamID: newTeam.ID
                })
            }))
        }

        const finalResponse = {}
        finalResponse.Hub = await newTeam.getHub()
        finalResponse.WebUsers = await newTeam.getWebUsers()
        finalResponse.Agents = await newTeam.getAgents()

        newTeam = { ...finalResponse, ...newTeam.toJSON() }
        console.log('New Team created with following JSON', JSON.stringify(newTeam))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_TEAM_CREATED',
            log: newTeam
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

        return newTeam

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }


