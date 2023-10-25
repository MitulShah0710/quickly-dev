const CIDPClient = require('aws-sdk/clients/cognitoidentityserviceprovider')
const CIDP = new CIDPClient()
const AppSync = require('aws-appsync')
const gql = require('graphql-tag')
const fetch = require('node-fetch')
const { env: { GQ_APP_ID, GQ_APP_URL, REGION, CLIENT_ID } } = process

const getAuthToken = async () => {
    console.log('issuing new Auth token')
    const { AuthenticationResult } = await CIDP.initiateAuth({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: {
            USERNAME: 'abhishek.desai+quickly-super-admin@appgambit.com',
            PASSWORD: 'Test@1234'
        }
    }).promise()
    .catch(e => {
        console.log('Cognito initiate auth failed!', JSON.stringify(e))
        return false
    })

    if(!AuthenticationResult) {
        return false
    }

    return AuthenticationResult
}

module.exports.handler = async (event) => {
    console.log('Incoming event and envs', JSON.stringify(event), JSON.stringify({ GQ_APP_ID, GQ_APP_URL }))

    //fetch the login token from cognito
    let apiToken, tokenReceived = true
    const { AccessToken=false } = await getAuthToken()
    if(!AccessToken) {
        console.log('Access token failed!')
        return
    }

    //call the mutation
    if (!globalThis.fetch) globalThis.fetch = fetch
    const appSyncClient = new AppSync.AWSAppSyncClient({
        url: GQ_APP_URL,
        region: REGION,
        auth: {
            type: 'AMAZON_COGNITO_USER_POOLS',
            jwtToken: AccessToken

        },
        disableOffline: true
    })

    const mutation = gql`mutation updateTenantAccountStatus($id: String!, $newStatus: TenantAccountStatus) {
        updateTenantAccountStatus(id: $id, newStatus: $newStatus) {
            id
            businessName
            contactFirstName
            contactLastName
            contactEmail  
            averageDrivers
            averageMonthlyOrders
            country
            address
            zipCode
            status
            ON_HOLD
        }
    }`

    // await appSyncClient.mutate(mutation)
    // .then(d => console.log(d))
    // .catch(e => console.log(e))
    appSyncClient.mutate({
        mutation,
        variables: {
            id: 'fe1c131666d25218b8dc9eae11d7bc569c7e3dcd',
            newStatus: 'INIT_QUIK_VALIDATION'
        }
    })

    return true
}


this.handler()