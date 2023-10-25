const middy = require('middy')
const { updateObjectProperty, requestFilter } = require('../../libs/utils')
const { middleware } = require("../sequelize-middleware");
const axios = require('axios')
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, WebUser, Agent, Hub, WebUserTeams, AgentTeams } } = models
    const { tenantHash, arguments, requesterUser } = event
    const { teamId, info } = arguments

    const requiredFields = ['name', 'autoAssignment', 'minCoverageRadius', 'maxCoverageRadius', 'HubID']
    const updateClause = requestFilter(info, requiredFields)
    try {
        console.log('update clause', JSON.stringify(updateClause))
        let updatedTeam = {}

        //depends on request, updates only if request contains fields 
        if (Object.keys(updateClause).length > 0) {
            updatedTeam = await Team.update({
                ...updateClause,
                updatedBy: requesterUser
            }, {
                where: {
                    ID: teamId,
                    TenantID: tenantHash
                },
                returning: true,
                plain: true
            })
            updatedTeam = updatedTeam[1]
            console.log('Team updated!', updatedTeam.toJSON())

        } else {
            updatedTeam = await Team.findOne({
                where: {
                    ID: teamId,
                    TenantID: tenantHash
                }
            })
            console.log('Team not updated!', updatedTeam.toJSON())
        }

        //handling webUsers
        if (info.webUsers && info.webUsers instanceof Array && info.webUsers.length > 0) {
            console.log('WebUsers info provided, updating WebUserTeams table!')
            await updatedTeam.setWebUsers(info.webUsers, { through: WebUserTeams })

        } else if (info.webUsers && info.webUsers instanceof Array && info.webUsers.length === 0) {
            console.log('Blank array of WebUsers provided, removing all connected entries from WebUserTeams table!')
            await updatedTeam.setWebUsers([], { through: WebUserTeams })
        }


        //handling agents
        if (info.agents && info.agents instanceof Array && info.agents.length > 0) {
            console.log('Agents info provided, updating AgentsTeams table!')
            await updatedTeam.setAgents(info.agents, { through: AgentTeams })

        } else if (info.agents && info.agents instanceof Array && info.agents.length === 0) {
            console.log('Blank array of Agents provided, removing all connected entries from AgentTeams table!')
            await updatedTeam.setAgents([], { through: AgentTeams })
        }

        const teamRelations = {}
        teamRelations.Hub = await updatedTeam.getHub()
        teamRelations.WebUsers = await updatedTeam.getWebUsers()
        teamRelations.Agents = await updatedTeam.getAgents()

        updatedTeam = { ...updatedTeam.toJSON(), ...teamRelations }
        console.log('Final team JSON after update!', JSON.stringify(updatedTeam))

        await axios.post(`${PRIVATE_API_ENDPOINT}/audit-logs`, {
            action: 'TENANT_TEAM_UPDATED',
            log: updatedTeam
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
        return updatedTeam

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }


