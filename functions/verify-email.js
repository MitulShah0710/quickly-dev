const AWS = require('aws-sdk')
const { sendResponse } = require('./libs/api-gateway-libs')
const docClient = new AWS.DynamoDB.DocumentClient()
const { CATALOG_DB } = process.env

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
    const { queryStringParameters } = event
    const { email = false, hashVal = false } = queryStringParameters
    if (!email || !hashVal) {
        console.log('No email provided on query string!')
        return sendResponse(400, { Error: 'Invalid request!' })
    }
    //get the row from dynamodb based on email and hashVal
    const tenantRow = await docClient.get({
        TableName: CATALOG_DB,
        Key: {
            id: hashVal,
        }
    }).promise()

    if (!tenantRow) {
        console.log('Invalid tenant details provided!')
        return sendResponse(400, { Error: 'Invalid request!' })
    }

    try {
        const updateRow = await docClient.update({
            TableName: CATALOG_DB,
            Key: {
                id: hashVal,
            },
            UpdateExpression: 'SET #status = :newStatus',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':newStatus': 'INIT_QUIK_VALIDATION',
                ':oldStatus': 'PENDING_EMAIL_VALIDATION'
            },
            ConditionExpression: '#status = :oldStatus',
            ReturnValues: 'ALL_NEW'
        }).promise()

        console.log('tenant status updated!', JSON.stringify(updateRow.Attributes))
        return sendResponse(200, `
            <center>
                <div>
                    <h1>Quickly Email Verified</h1>
                    <p>Thank you for verifying your email with us. We will send you further updates on your registered email shortly.</p>
                </div>
            </center>
        `, 'text/html')
    } catch (e) {
        console.log('tenant status update failed!', JSON.stringify(e))
        return sendResponse(400, { Error: 'Invalid request!' })
    }
}



