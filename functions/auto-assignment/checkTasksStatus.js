'use strict';

const AppSync = require('aws-appsync')
const gql = require('graphql-tag')
const fetch = require('node-fetch')
const { env: { GQ_API_KEY, GQ_APP_URL, REGION } } = process

module.exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));
  const { tenantHash } = event;

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


  const query = gql`query getTaskStatus($tenantID: String!, $teamID: String, $taskID: String!) {
    getTaskStatus(tenantID: $tenantID, teamID: $teamID, taskID: $taskID) {
      taskStatus
    }
  }`

  const result = await appSyncClient.query({
    query,
    variables: {
      tenantID: tenantHash,
      teamID: event.task.teamId,
      taskID: event.task.id
    }
  }).catch(e => {
    console.log('Error at graphql', JSON.stringify(e))
    throw e
  })

  console.log('results', JSON.stringify(result))

  let taskAssigned = (result.data.getTaskStatus.taskStatus != 'NOT_ASSIGNED' &&
                      result.data.getTaskStatus.taskStatus != 'PENDING_ACCEPTANCE' &&
                      result.data.getTaskStatus.taskStatus != 'CREATED' &&
                      result.data.getTaskStatus.taskStatus != 'INVALID_LOCATION')

  return {
    taskAssigned: taskAssigned
  }
};
