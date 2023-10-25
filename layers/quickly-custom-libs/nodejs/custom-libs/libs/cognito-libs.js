const AWS = require('aws-sdk')
const CIDP = new AWS.CognitoIdentityServiceProvider()
const { USERPOOL_ID } = process.env

module.exports = {
    createCognitoUser: async (username, email, hashVal) => {
        const params = {
            UserPoolId: USERPOOL_ID,
            Username: username,
            TemporaryPassword: 'Test@1234',
            DesiredDeliveryMediums: [
                'EMAIL',
            ],
            UserAttributes: [
                {
                    Name: 'email',
                    Value: email
                },
                {
                    Name: 'email_verified',
                    Value: 'True'
                },
                {
                    Name: 'custom:TENANT_HASH',
                    Value: hashVal
                },
            ]
        };

        console.log('Admin create user request', JSON.stringify(params))
        return CIDP.adminCreateUser(params).promise()
            .catch(e => console.log(e))

    },

    createTenantGroup: async (groupName) => {
        const params = {
            GroupName: groupName,
            UserPoolId: USERPOOL_ID,
            Description: `Group will be internally used by ${groupName}`,
        };

        console.log('Tenant group request', JSON.stringify(params))
        return CIDP.createGroup(params).promise()

    },

    addUserToGroup: async (groupName, username) => {
        const param = {
            GroupName: groupName, 
            UserPoolId: USERPOOL_ID, 
            Username: username 
        };

        console.log('Admin add user to group request', JSON.stringify(param))
        return CIDP.adminAddUserToGroup(param).promise()
    }
}
