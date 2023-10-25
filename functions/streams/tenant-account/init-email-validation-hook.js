const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient()
const { pinpointSendMessage } = require('../../libs/pinpoint-utility')
const { API_URL, CATALOG_DB, PINPOINT_EMAIL_TEMP } = process.env

const emailValidationBody = PINPOINT_EMAIL_TEMP

module.exports.initEmailValidationHook = async (NewItem) => {
    const obj = {
        tenantId: NewItem.id,
        link: `${API_URL}/verify/email?email=${encodeURIComponent(NewItem.contactEmail)}&hashVal=${encodeURI(NewItem.id)}`
    }
    try {
        await pinpointSendMessage([NewItem.contactEmail], 'Quickly Email Verification', obj)

        await docClient.update({
            TableName: CATALOG_DB,
            Key: {
                id: NewItem.id,
            },
            UpdateExpression: 'SET #status = :newStatus',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':newStatus': 'PENDING_EMAIL_VALIDATION'
            },
            ReturnValues: 'ALL_NEW'
        }).promise()
            .then(d => {
                console.log('Status updated to pending email validation', JSON.stringify(d.Attributes))
            })
    } catch (e) {
        console.log('Error tracked', e)
        return e
    }
}