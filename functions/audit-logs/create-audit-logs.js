const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient()
const { env: { AUDIT_LOGS_DB } } = process
const moment = require('moment')
const { sendResponse } = require('../libs/api-gateway-libs')

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
    const { action = false, log = false } = event
    if (!action || !log) {
        console.log('Invalid request')
        return
    }

    if (action !== false && log !== false) {
        await docClient.put({
            TableName: AUDIT_LOGS_DB,
            Item: {
                year: moment().format('Y'),
                eventTime: `${new Date().getTime()}#${action}`,
                log
            }
        }).promise()
            .then(d => console.log('new log added!'))
            .catch(e => {
                console.log('Error in creating log!', JSON.stringify(e))
            })
    }

    return sendResponse(200, { status: true })
}