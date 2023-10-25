const AWS = require('aws-sdk')
const lambda = new AWS.Lambda()
const CIDP = new AWS.CognitoIdentityServiceProvider()
const { pinpointSendMessage } = require('../../libs/pinpoint-utility')
const { createTenantGroup, createCognitoUser, addUserToGroup, listUsersInGroupRecursive } = require('../../libs/cognito-libs')

const readyToWorkBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Quickly</title>
</head>
<body>
    <h1>Welcome to Quickly</h1>
    <p>We are excited to have you part of the Quickly. Your account is ready to use and you will shortly receive an email with your temporary password.</p>
</body>
</html>
`



module.exports.initReadyWorkHook = async (NewItem) => {
    let emailTemplate = readyToWorkBody.replace(/{{tenantId}}/g, NewItem.id)
    //create group for the tenant
    try {
        const tenantGroup = await createTenantGroup(`TENANT_${NewItem.id}`)
        //creating admin user
        const tenantAdmin = await createCognitoUser(NewItem.contactEmail, NewItem.contactEmail, NewItem.id)

        const adminUsers = await listUsersInGroupRecursive('SuperAdmin')
        const adminUserEmails = []
        adminUsers.map(user => {
            const { Attributes } = user
            Attributes.map(e => {
                if(e.Name === 'email') {
                    adminUserEmails.push(e.Value)
                }
            })
        })

        //adding admin to group
        if (tenantGroup && tenantAdmin) {
            const { GroupName } = tenantGroup.Group
            const { Username } = tenantAdmin.User
            await addUserToGroup(GroupName, Username)
            await addUserToGroup('TenantAdmin', Username)
            NewItem.userId = Username
            console.log('Group and admin created, admin user added to group!')
        }

        // creating base data, rds
        await lambda.invoke({
            FunctionName: process.env.BASE_DATA_LAMBDA_ARN,
            InvocationType: 'Event',
            Payload: JSON.stringify(NewItem)
        }).promise()

        await pinpointSendMessage([NewItem.contactEmail], 'Quickly Account Created', emailTemplate)
        await pinpointSendMessage(adminUserEmails, 'Quickly Account Created', emailTemplate)
    } catch (e) {
        console.log('Error tracked', JSON.stringify(e))
        return
    }
}