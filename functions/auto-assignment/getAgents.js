'use strict';

const AppSync = require('aws-appsync')
const gql = require('graphql-tag')
const fetch = require('node-fetch')
const { env: { GQ_API_KEY, GQ_APP_URL, REGION } } = process

const handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  const { tenantHash } = event

  // TODO: Need to get Agents and its latlong coordinates, maybe reuse getAgentsByTeamAndStatus
  //       There are two use cases for this API:
  //       1) No agents IDs provided
  //          Given Tenant Hash and Team ID it should returned list of Agents
  //          and its coordinates, where each agent belongs to Tenant and Team,
  //          its workStatus==AVAILABLE and it has less than Max Tasks already assigned
  //       2) Agents IDs provided
  //          Given Tenant Hash, Team ID, and Agents' ID list, it should returned list
  //          of Agents and its coordinates


    if (!globalThis.fetch) globalThis.fetch = fetch
    const appSyncClient = new AppSync.AWSAppSyncClient({
        url: GQ_APP_URL,
        region: REGION,
        auth: {
            type: 'API_KEY',
            apiKey: GQ_API_KEY

        },
        disableOffline: true
    })


    const query = gql`query getTenantAgents($tenant:String!, $team:String!) {
        getTenantAgents(tenantID: $tenant, teamID:$team, agentStatus:ACTIVE) {
            ID
            workStatus
            latitude
            longitude
            activeTaskCount
        }
    }`

    const result = await appSyncClient.query({
        query,
        variables: {
            tenant: tenantHash,
            team: event.task.teamId
        }
    }).catch(e => {
        console.log('Error at graphql', JSON.stringify(e))
        throw e
    })

    console.log('results', JSON.stringify(result))

    return result.data.getTenantAgents

}

module.exports = { handler }