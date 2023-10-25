const AWS  = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient()
const { CATALOG_DB } = process.env
const { getUserGroups } = require('../../libs/cognito-libs')

module.exports.handler = async (event) => {
    console.log('incoming event', JSON.stringify(event))
    
    const {request: { userAttributes, validationData = false }, userName, userPoolId } = event
    if(userAttributes["custom:TENANT_HASH"]) {
        console.log('Tenant specific sign in attempt, checking for ON_HOLD property!')
        const tenantAccount = await docClient.get({
            TableName: CATALOG_DB,
            Key: {
                id: userAttributes["custom:TENANT_HASH"]
            }
        }).promise()
        .then(d => d.Item)
        .catch(e => {
            console.log(JSON.stringify(e))
            return false
        })
        
        console.log('tenant data', JSON.stringify(tenantAccount))
        
        if(tenantAccount && tenantAccount.ON_HOLD === true) {
            throw new Error('TENANT_DISABLED')
        }

        if(validationData && validationData.platform && validationData.platform === 'MOBILE_APP') {
            console.log('mobile flag available! checking for TenantDriver group condition!')
            const { Groups=[] } = await getUserGroups(userName, userPoolId)
            if(!Groups.find(group => group.GroupName === 'TenantDriver')) {
                throw new Error('Only Agent users can login to mobile app!')
            }
        }


    } else {
    console.log('Not a Tenant specific sign in attempt, check skipped for ON_HOLD property!')
        
    }
    
    return event
};


/*
Standard event structure
{
    "version": "1",
    "region": "us-east-1",
    "userPoolId": "us-east-1_0Naz98i8Z",
    "userName": "180943a9-6cef-4405-919e-1f393b7cc322",
    "callerContext": {
        "awsSdkVersion": "aws-sdk-unknown-unknown",
        "clientId": "2i22m1tlomeqlr4mol9urtu3f"
    },
    "triggerSource": "PreAuthentication_Authentication",
    "request": {
        "userAttributes": {
            "sub": "180943a9-6cef-4405-919e-1f393b7cc322",
            "cognito:user_status": "CONFIRMED",
            "custom:TENANT_HASH": "a53671da39e09fe7d130bc6b6ede081d811531f9",
            "email_verified": "True",
            "given_name": "Albert",
            "email": "abhishek.desai+test102-admin@appgambit.com"
        },
        "validationData": null,
        "userNotFound": false
    },
    "response": {}
}

*/