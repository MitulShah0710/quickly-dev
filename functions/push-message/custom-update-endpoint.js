const AWS = require('aws-sdk')
const docClient = new AWS.DynamoDB.DocumentClient()
const { env: { ENDPOINT_DB } } = process

module.exports.handler = async (event) => {
    console.log('Incoming request', JSON.stringify(event))
    const { arguments: { deviceToken, isRemove = false }, tenantHash, requesterUser } = event
    let successFlag = true

    const alreadyThere = await docClient.get({
        TableName: ENDPOINT_DB,
        Key: {
            id: requesterUser
        }
    }).promise()
    console.log(alreadyThere.Item)

    if (isRemove === true) {
        console.log('log out event detected!')
        const { Item } = alreadyThere
        const deviceTokenIndex = Item.tokens && Array.isArray(Item.tokens) === true && Item.tokens.length ? Item.tokens.indexOf(deviceToken) : false;

        console.log('devicetokenIndex', deviceTokenIndex)
        if (deviceTokenIndex !== false) {
            await docClient.update({
                TableName: ENDPOINT_DB,
                Key: {
                    id: requesterUser
                },
                UpdateExpression: `REMOVE tokens[${deviceTokenIndex}]`
            }).promise()
                .then(d => console.log('device token removed!'))
                .catch(e => {
                    console.log('failed to remove device token!', e)
                    successFlag = false
                })
        } else {
            console.log('remove device token failed!')
        }
    } else {
        console.log('log in event detected!')
        if (alreadyThere.Item) {
            const { tokens } = alreadyThere.Item
            if (tokens.includes(deviceToken)) {
                console.log('Token is already registered!')
                return true
            }

            console.log('already found!')
            await docClient.update({
                TableName: ENDPOINT_DB,
                Key: {
                    id: requesterUser
                },
                UpdateExpression: 'SET tokens = list_append(tokens, :token)',
                ExpressionAttributeValues: {
                    ':token': [deviceToken]
                }
            }).promise()
                .then(d => console.log('Old entry updated with new token!'))
                .catch(e => {
                    console.log('old entry failed to update!', e)
                    successFlag = false
                })

        } else {
            console.log('not found!')
            await docClient.put({
                TableName: ENDPOINT_DB,
                Item: {
                    id: requesterUser,
                    tenantHash,
                    tokens: [deviceToken]
                }
            }).promise()
                .then(d => console.log('New entry added!'))
                .catch(e => {
                    console.log('fail to add new entry!')
                    successFlag = false
                })
        }
    }




    return successFlag
}