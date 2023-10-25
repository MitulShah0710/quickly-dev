const AWS = require('aws-sdk')
const axios = require('axios')
const docClient = new AWS.DynamoDB.DocumentClient()
const { env: { ENDPOINT_DB, FCM_SERVER_KEY }} = process

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
    const { notification, to = [] } = event

    const deviceTokens = []
    await Promise.all(to.map(async e => {
        await docClient.get({
            TableName: ENDPOINT_DB,
            Key: {
                id: e
            }
        }).promise()
            .then(d => {
                const { Item } = d
                if(Item) {
                    deviceTokens.push(...Item.tokens);
                }
            })
    }))

    await Promise.all(deviceTokens.map(e => {
        const data = JSON.stringify({
            notification,
            to: e
        });

        const config = {
            method: 'post',
            url: 'https://fcm.googleapis.com/fcm/send',
            headers: {
                'Authorization': `key=${FCM_SERVER_KEY}`,
                'Content-Type': 'application/json'
            },
            data: data
        };

        console.log('config', JSON.stringify(config))
        return axios(config)
            .then(function (response) {
                console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
                console.log(error);
            });
    }))

    return
}
