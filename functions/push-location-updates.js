const { sendResponse } = require("./libs/api-gateway-libs")
const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient()
const AppSync = require('aws-appsync')
const gql = require('graphql-tag')
const fetch = require('node-fetch')
const { env: { LOCATION_DB, GQ_APP_ID, GQ_APP_URL, REGION, CLIENT_ID, STAGE, LOCATION_PUSH_API_KEY } } = process

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify({ event, env: process.env }))
    const { body = {} } = event
    const { location = false } = JSON.parse(body)

    if (!location) {
        return sendResponse(400, { Error: 'Bad Request!' })
    }

    console.log('Total location objects received!', location.length)
    if (location && location.length) {
        await Promise.all(location.map(async singleLoc => {
            console.log('Processing -> ', JSON.stringify(singleLoc))
            const { coords: { latitude = 0, longitude = 0, speed = 0 }, extras: { agentID = false, tenantID = false, status = false, taskID = false }, activity: { type }, timestamp } = singleLoc
            if ((latitude !== 0 && longitude !== 0) && (agentID !== false && tenantID !== false)) {
                const param = {
                    TableName: LOCATION_DB,
                    Item: {
                        pk: `${tenantID}#${agentID}`,
                        sk: timestamp,
                        latitude,
                        speed,
                        longitude,
                        activityType: type,
                        createdAt: new Date().toISOString()
                    }
                }

                if(status !== false) {
                    param.Item.status = status
                }

                if(taskID !== false) {
                    param.Item.taskID = taskID
                }

                console.log('DB create param', JSON.stringify(param))
                await docClient.put(param).promise()
                    .then(d => console.log('DB create status', JSON.stringify(d)))
                    .catch(e => console.log('DB create failed!', JSON.stringify(e)))
            }
        }))

        try {
            const { coords: { latitude = 0, longitude = 0 }, extras: { agentID = false, tenantID = false }, timestamp } = location[location.length - 1]
            if (!globalThis.fetch) globalThis.fetch = fetch
            const appSyncClient = new AppSync.AWSAppSyncClient({
                url: GQ_APP_URL,
                region: REGION,
                auth: {
                    type: "API_KEY",
                    apiKey: LOCATION_PUSH_API_KEY
                },
                disableOffline: true
            })

            const mutation = gql`mutation updateAgentLocation($agentID: String!, $tenantID: String!, $lat: Float!, $long: Float!) {
                updateAgentLocation(agentID: $agentID, tenantID: $tenantID, lat: $lat, long: $long) {
                    ID
                    workStatus
                    latitude
                    longitude
                    activeTaskCount
                }
            }`

            const result = await appSyncClient.mutate({
                mutation,
                variables: {
                    agentID,
                    tenantID,
                    lat: latitude,
                    long: longitude
                }
            })

            console.log('result of mutation', JSON.stringify(result))
            return sendResponse(200, { Message: 'Location added on DynamoDB! & updated on PostGreSQL!' })

        } catch (e) {
            console.log('Appsync mutation invoke failed!', JSON.stringify(e))
            return sendResponse(500, { Error: 'AppSync invoke failed!' })
        }


    }
    return sendResponse(200, {})
}