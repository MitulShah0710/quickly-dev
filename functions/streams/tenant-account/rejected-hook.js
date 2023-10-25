const AWS = require('aws-sdk')
const { pinpointSendMessage } = require('../../libs/pinpoint-utility')

const rejectedBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Quickly</title>
</head>
<body>
    <h1>Welcome to Quickly</h1>
    <p>Unfortunately we are unable to verify your account detail. Please get in touch with us with more detail.</p>
</body>
</html>
`

module.exports.rejectedHook = async (NewItem) => {
    let emailTemplate = rejectedBody.replace(/{{tenantId}}/g, NewItem.id)

    try {

        await pinpointSendMessage([NewItem.contactEmail], 'Quickly Tenant Verification Acknowledgement', emailTemplate)
    } catch (e) {
        console.log('Error tracked ', JSON.stringify(e))
        throw e
    }
}