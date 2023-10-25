const AWS = require('aws-sdk')
const ObjectHash = require('object-hash')
const docClient = new AWS.DynamoDB.DocumentClient()
const { CATALOG_DB, AUDIT_LOGS_DB } = process.env
const moment = require('moment')

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
    const { info = {} } = event

    //create hash value
    const hashVal = ObjectHash({ contactEmail: info.contactEmail })
    info.id = hashVal
    info.createdAt = new Date().toISOString()
    info.status = 'INIT_EMAIL_VALIDATION'
    info.ON_HOLD = false

    //create row at table
    const param = {
        TableName: CATALOG_DB,
        Item: info,
        ConditionExpression: '#id <> :id AND #contactEmail <> :contactEmail',
        ExpressionAttributeNames: {
            '#id': 'id',
            '#contactEmail': 'contactEmail'
        },
        ExpressionAttributeValues: {
            ':id': hashVal,
            ':contactEmail': info.contactEmail
        }
    }
    try {
        const row = await docClient.put(param).promise()
        await docClient.put({
            TableName: AUDIT_LOGS_DB,
            Item: {
                year: moment().format('Y'),
                eventTime: `${new Date().getTime()}#NEW_TENANT`,
                log: info
            }
        }).promise()
            .then(d => console.log('New Tenant audit log added!'))
            .catch(e => console.log('Error in creating audit logs!', JSON.stringify(e)))

        console.log('Row created on DB!', JSON.stringify(row))
        return info
    } catch (e) {
        console.log('Error in tenant creation', JSON.stringify(e))
        throw e
    }
}

