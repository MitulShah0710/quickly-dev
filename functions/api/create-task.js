'use strict';

const DynamoDB = require('aws-sdk/clients/dynamodb')
const docClient = new DynamoDB.DocumentClient()
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda")
const lambdaClient = new LambdaClient({region: 'us-east-1'})

const { env: { GQ_API_KEY, GQ_APP_URL, REGION, CATALOG_DB, GOOGLE_MAPS_API_KEY, LOCATION_FUNCTION } } = process
const { sendResponse } = require('../libs/api-gateway-libs')
const AppSync = require('aws-appsync')
const gql = require('graphql-tag')
const fetch = require('node-fetch')
const {Client} = require("@googlemaps/google-maps-services-js");
const axios = require('axios')

const getFieldTasks = () => {
    return ['ID', 'taskType','taskMode','priority','value','completedOn',
            'ratingByAgent','commentsByAgent','customerName','customerEmail',
            'customerPhone','customerAddress','customerLatLongs{lat,long}','taskDescription',
            'taskDetails{code,item,qty}','taskStatus',
            'AgentID','TeamID',
            'WebUser{ID,firstName,lastName}',
            'updatedAt','createdAt','plannedDate',
            'allowEdit','weight','additionalInfo',
            'TaskHistories {ID,status,comment,timestamp,latLongs{lat,long}}',
            'Team {ID,name}',
            'pickupAddress','pickupLatLongs{lat,long}',
            'orderID','orderPlacedOn',
            'routeSequence', 'routeID',
            'deliveryAddress','deliveryPhoto','deliverySignature','deliveryComment','deliveryDate'];
}

/**
 * Transform customer and/or pickup data using previously stored locations
 * It requires that the caller pass the previously-stored locationId
 * @param {*} tasks list of tasks to potentially transform
 * @param {*} appSyncClient AppSync client object
 * @param {*} tenantHash tenant identifier, currently not used
 */
const transformTaksInfo = async (tasks, appSyncClient, tenantHash) => {
    let getLocationPromises = []
    const query = gql`query GetLocation($locationId:String!, $tenant:String) {
        getLocation(locationId: $locationId, tenant:$tenant) {
            ID
            address
            name
            phone
            email
            latLongs {
                lat
                long
            }
        }
    }`
    // Get Locations' info if LocationIDs were provided
    tasks.forEach(element => {
        if (element.customerLocationId && element.customerLocationId !== '') {
            getLocationPromises.push(
                appSyncClient.query({
                    query,
                    variables: {
                        locationId: element.customerLocationId,
                        tenant: tenantHash
                    }
                })
            )
        }
        if (element.pickupLocationId && element.pickupLocationId !== '') {
            getLocationPromises.push(
                appSyncClient.query({
                    query,
                    variables: {
                        locationId: element.pickupLocationId,
                        tenant: tenantHash
                    }
                })
            )
        }
    })

    const locationsData = await Promise.all(getLocationPromises)
    console.log(`${locationsData.length} locationIds retrieved`);

    // Transform Tasks' input data using Locations' information
    tasks.forEach(element => {
        if (element.customerLocationId && element.customerLocationId !== '') {
            let customer = locationsData.filter(l => l.data.getLocation.ID === element.customerLocationId)
            if (customer.length !== 0) {
                element.customerAddress= customer[0].data.getLocation.address || ''
                element.customerEmail= customer[0].data.getLocation.email  || ''
                element.customerLatLongs = {
                    lat: customer[0].data.getLocation.latLongs.lat,
                    long: customer[0].data.getLocation.latLongs.long
                }
                element.customerName= customer[0].data.getLocation.name || ''
                element.customerPhone= customer[0].data.getLocation.phone
            } else {
                console.log(`Could not find locationId ${element.customerLocationId} provided`)
            }
            // On any case delete locationId as it is not part of the Task object
            delete element.customerLocationId
        }

        if (element.pickupLocationId && element.pickupLocationId !== '') {
            let pickup = locationsData.filter(l => l.data.getLocation.ID === element.pickupLocationId)
            if (pickup.length !== 0) {
                element.pickupAddress= pickup[0].data.getLocation.address || ''
                element.pickupEmail= pickup[0].data.getLocation.email  || ''
                element.pickupLatLongs= {
                    lat: pickup[0].data.getLocation.latLongs.lat,
                    long: pickup[0].data.getLocation.latLongs.long
                }
                element.pickupName= pickup[0].data.getLocation.name || ''
                element.pickupPhone= pickup[0].data.getLocation.phone
            } else {
                console.log(`Could not find locationId ${element.pickupLocationId} provided`)
            }
            // On any case delete locationId as it is not part of the Task object
            delete element.pickupLocationId
        }
    })

}

const geoMatch1 = ["street_address", "premise", "subpremise", "plus_code", "airport", "park", "point_of_interest", "establishment", "drugstore", "health", "pharmacy", "store"]
const geoMatch2 = ["intersection", "route"]

const storeLocation = async(element, isPickup, geocodeResult, tenantHash) => {
    let locationObject = {
        "field": "createLocation",
        "arguments": {
            "info": {
                "latLongs": {
                    "lat": geocodeResult.geometry.location.lat,
                    "long": geocodeResult.geometry.location.lng
                },
                "type": geocodeResult.types.includes("point_of_interest") ? "B" : "H"
            }
        },
        "tenantHash": tenantHash,
        "requesterUser": "API"
    }
    if (isPickup) {
        locationObject.arguments.info["name"] = element.pickupName
        locationObject.arguments.info["phone"] = element.pickupPhone
        locationObject.arguments.info["address"] = element.pickupAddress
    } else {
        locationObject.arguments.info["name"] = element.customerName
        locationObject.arguments.info["phone"] = element.customerPhone
        locationObject.arguments.info["address"] = element.customerAddress
    }

    const command = new InvokeCommand({
        FunctionName: LOCATION_FUNCTION,
        InvocationType: 'Event',
        Payload: JSON.stringify(locationObject)
    });

    await lambdaClient.send(command);
}

const determineGeocodeQuality = (element, isPickup, geocodeData, tenantHash) => {
    let qualityName = 'customerGeocodeQuality'
    let coordinatesName = 'customerLatLongs'
    let addressName = 'customerAddress'
    if (isPickup) {
        qualityName = 'pickupGeocodeQuality'
        coordinatesName = 'pickupLatLongs'
        addressName = 'pickupAddress'
    }

    let geocodeResult =  geocodeData.results[0]  // If address match is ambigous, use first match
    // console.log(JSON.stringify(geocodeResult))
    if (geocodeResult && geocodeData.status === "OK") {
        if ( geocodeResult.geometry.location_type === "ROOFTOP" ||
             geoMatch1.some(value => geocodeResult.types.includes(value)) ) {
            element[qualityName] = 1
            element[coordinatesName] = {
                lat: geocodeResult.geometry.location.lat,
                long: geocodeResult.geometry.location.lng,
            }
            storeLocation(element, isPickup, geocodeResult, tenantHash)
            // element[addressName] = geocodeResult.formatted_address

        } else if (geoMatch2.some(value => geocodeResult.types.includes(value))) {
            element[qualityName] = 2
            element[coordinatesName] = {
                lat: geocodeResult.geometry.location.lat,
                long: geocodeResult.geometry.location.lng,
            }
            storeLocation(element, isPickup, geocodeResult, tenantHash)
            // element[addressName] = geocodeResult.formatted_address

        } else {
            element[qualityName] = 3
            element[coordinatesName] = {
                lat: geocodeResult.geometry.location.lat,
                long: geocodeResult.geometry.location.lng,
            }
            // element[addressName] = geocodeResult.formatted_address
            element.invalidLocation = true
        }

    } else {
        element[qualityName] = 4
        element.invalidLocation = true
    }
}

const geocodeTasks = async(tasks, tenantHash) => {
    let getGeocodingPromises = []
    const client = new Client({})

    tasks.forEach(element => {
        // Geocode customer address
        if (element.customerAddress && element.customerAddress !== '' &&
        (!element.customerLatLongs || !element.customerLatLongs.lat || !element.customerLatLongs.long) ) {
            getGeocodingPromises.push(
                client.geocode({
                    params: {
                        address: element.customerAddress,
                        key: GOOGLE_MAPS_API_KEY,
                    },
                    timeout: 2500, // milliseconds
                })
            )
        }
        // Geocode pickup address
        if (element.pickupAddress && element.pickupAddress !== '' &&
        (!element.pickupLatLongs || !element.pickupLatLongs.lat || !element.pickupLatLongs.long) ) {
            getGeocodingPromises.push(
                client.geocode({
                    params: {
                        address: element.pickupAddress,
                        key: GOOGLE_MAPS_API_KEY,
                    },
                    timeout: 2500, // milliseconds
                })
            )
        }
    })

    // Wait for geocode to complete
    const geocodeData = await Promise.all(getGeocodingPromises);
    if (geocodeData && geocodeData.length > 0) {
        console.log(JSON.stringify(`${geocodeData.length} addresses geocoded`))
    }

    // Process geocode results and update tasks
    tasks.forEach(element => {
        // Process customer address
        if (element.customerAddress && element.customerAddress !== '' &&
        (!element.customerLatLongs || !element.customerLatLongs.lat || !element.customerLatLongs.long) ) {
            determineGeocodeQuality(element, false, geocodeData.shift().data, tenantHash)
        }
        // Process pickup address
        if (element.pickupAddress && element.pickupAddress !== '' &&
        (!element.pickupLatLongs || !element.pickupLatLongs.lat || !element.pickupLatLongs.long) ) {
            determineGeocodeQuality(element, true, geocodeData.shift().data, tenantHash)
        }
    })

}

// Wrap to call GraphQL createTask mutation
// Validate input data is done by API GW using schema defined in serverless.yml
module.exports.handler = async (event) => {
    let createTaskPromises = []
    console.log('Incoming event', JSON.stringify(event))
    let tenantHash = null

    if (event.requestContext.identity.apiKey) {
        // ApiKey authentication
        const apiKey = event.requestContext.identity.apiKey

        // Read Tenant Hash from DynamoDB Catalog DB based on apikey
        const param = {
            TableName: CATALOG_DB,
            IndexName: 'apikey-index',
            KeyConditions: {
                apiKeyValue: {
                    ComparisonOperator: 'EQ',
                    AttributeValueList: [apiKey]
                }
            }
        }
        const tenantRow = await docClient.query(param).promise()

        // console.log('tenantRow', JSON.stringify(tenantRow.Items))

        if (!tenantRow) {
            console.log('There is no tenant mapped to provided api key')
            return sendResponse(400, { Error: 'Invalid apikey!' })
        }

        tenantHash = tenantRow.Items[0].id

    } else {
        // Cognito authentication
        if (!event.requestContext.authorizer.claims) {
            console.log('Missing authentication claims')
            return sendResponse(400, { Error: 'Missing authentication claims!' })
        }
        tenantHash = event.requestContext.authorizer.claims["custom:TENANT_HASH"]
    }

    try {
        // Init GraphQL client
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
        const mutation = gql`
        mutation CreateTaskBulk($info: [TaskCreateInput], $tenant: String) {
        createTaskBulk(info: $info, tenant: $tenant) {
            ID
            orderID
        }
        }
        `

        console.log('resolving locationIDs if any')
        let tasks = JSON.parse(event.body).tasks;

        // retrieve coordinates if Location IDs were provided
        await transformTaksInfo(tasks, appSyncClient, tenantHash);

        // Geocode if coordinates are empty and there is a non-empty address
        console.log('Geocoding addresses')
        await geocodeTasks(tasks, tenantHash);

        console.log('calling CreateTaskBulk mutation', tenantHash)
        // Call createTask mutations

        createTaskPromises.push(
            appSyncClient.mutate({
                mutation,
                variables: {
                    tenant: tenantHash,
                    info: tasks
                }
            })
        )

        // Calculate Geocode Stats
        let geoStats = {
            deliveryGeocodeMatchExcellent: tasks.filter(t => t.customerGeocodeQuality && t.customerGeocodeQuality === 1).length,
            deliveryGeocodeMatchGood: tasks.filter(t => t.customerGeocodeQuality && t.customerGeocodeQuality === 2).length,
            deliveryGeocodeMatchPoor: tasks.filter(t => t.customerGeocodeQuality && t.customerGeocodeQuality === 3).length,
            deliveryGeocodeMatchNone: tasks.filter(t => t.customerGeocodeQuality && t.customerGeocodeQuality === 4).length,
            pickupGeocodeMatchExcellent: tasks.filter(t => t.pickupGeocodeQuality && t.pickupGeocodeQuality === 1).length,
            pickupGeocodeMatchGood: tasks.filter(t => t.pickupGeocodeQuality && t.pickupGeocodeQuality === 2).length,
            pickupGeocodeMatchPoor: tasks.filter(t => t.pickupGeocodeQuality && t.pickupGeocodeQuality === 3).length,
            pickupGeocodeMatchNone: tasks.filter(t => t.pickupGeocodeQuality && t.pickupGeocodeQuality === 4).length,
        }

        // Wait for GraphQL APIs and return Tasks IDs
        const newTasks = await Promise.all(createTaskPromises)
        console.log(`${newTasks[0].data.createTaskBulk.length} tasks created`);
        // console.log(JSON.stringify(newTasks))
        const newTasksIds = newTasks[0].data.createTaskBulk.map(t =>  ({ID: t.ID, orderID: t.orderID}) )
        // console.log(JSON.stringify(newTasksIds))

        return sendResponse(200, {
            Status: 'OK',
            TaskIDs: newTasksIds,
            GeocodeStats: geoStats
        })

    } catch(e) {
        console.error("Exception processing the request", JSON.stringify(e))
        return sendResponse(500, { Error: 'Exception processing the request' })
    }

}