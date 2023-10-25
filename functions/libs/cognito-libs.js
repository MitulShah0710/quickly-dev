const AWS = require('aws-sdk')
const CIDP = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' })
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
        // .catch(e => console.log(e))

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
    },

    disableUser: async (userID) => {
        const params = {
            UserPoolId: USERPOOL_ID,
            Username: userID
        };

        console.log('Disabling user requested', params)
        return CIDP.adminDisableUser(params).promise()
    },

    enableUser: async (userID) => {
        const params = {
            UserPoolId: USERPOOL_ID,
            Username: userID
        };

        console.log('Enabling user requested', params)
        return CIDP.adminEnableUser(params).promise()
    },

    getUser: async (userID) => {
        const params = {
            UserPoolId: USERPOOL_ID,
            Username: userID
        };

        console.log('Requesting user details cognito', params)
        return CIDP.adminGetUser(params).promise()
    },

    getUserGroups: async (userID, USERPOOL) => {
        const params = {
            UserPoolId: USERPOOL,
            Username: userID
        };

        return CIDP.adminListGroupsForUser(params).promise()
    },

    listUsersInGroupRecursive: (groupName, data = [], nextToken = false) => {
        const param = {
            GroupName: groupName,
            UserPoolId: USERPOOL_ID,
        }

        if (nextToken) {
            param.NextToken = nextToken
        }

        return CIDP.listUsersInGroup(param).promise()
            .then(d => {
                data.push(...d.Users)
                if (d.NextToken) {
                    return listUsersInGroupRecursive(data, d.NextToken)
                } else {
                    return data
                }
            })
    }
}