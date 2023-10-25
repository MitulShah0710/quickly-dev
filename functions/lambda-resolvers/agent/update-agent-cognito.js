const AWS = require('aws-sdk')
const CIDP = new AWS.CognitoIdentityServiceProvider()
const { disableUser, enableUser } = require('../../libs/cognito-libs')
const middy = require('middy')
const { validateTenantRelation } = require('../validate-tenant-relation-middleware')
const { USERPOOL_ID } = process.env

const handler = middy(async (event) => {
    console.log('Incoming event', JSON.stringify(event))

    const { arguments, tenantHash, user } = event
    const { info, agentID } = arguments
    const { firstName = false, lastName = false, status = false } = info

    let error = false
    const param = {
        UserAttributes: [],
        UserPoolId: USERPOOL_ID,
        Username: agentID
    }

    if (firstName) {
        param.UserAttributes.push({
            Name: "given_name",
            Value: firstName
        })
    }

    if (lastName) {
        param.UserAttributes.push({
            Name: "family_name",
            Value: lastName
        })
    }

    try {
        console.log('Update params', JSON.stringify(param))
        await CIDP.adminUpdateUserAttributes(param).promise()
        console.log('attributes updated at cognito!')

        if (status) {
            if (status === 'ACTIVE') {
                await enableUser(agentID)
            } else {
                await disableUser(agentID)
            }
        }

    } catch (e) {
        console.log('Error', JSON.stringify(e))
        error = true
    }

    return {
        userUpdatedAtCognito: error === false ? true : false
    }
})

handler.use({
    before: validateTenantRelation
})

module.exports = { handler }
