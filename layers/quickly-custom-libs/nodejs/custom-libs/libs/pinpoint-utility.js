const AWS = require('aws-sdk')
const Pinpoint = new AWS.Pinpoint()
const { PINPOINT_APP, FROM_EMAIL } = process.env

const pinpointSendMessage = async (toAddresses = [], subject = '', body = '') => {
    const param = {
        ApplicationId: PINPOINT_APP,
        MessageRequest: {
            Addresses: {},
            MessageConfiguration: {
                EmailMessage: {
                    FromAddress: FROM_EMAIL,
                    SimpleEmail: {
                        Subject: {
                            Charset: 'UTF-8',
                            Data: subject,
                        },
                        HtmlPart: {
                            Charset: 'UTF-8',
                            Data: body,
                        }
                    },
                },
            }
        }
    };

    toAddresses.map(e => {
        param.MessageRequest.Addresses[e] = { ChannelType: 'EMAIL' }
    })

    console.log('Pinpoint send message params', JSON.stringify(param))
    return Pinpoint.sendMessages(param).promise()
}

module.exports = {
    pinpointSendMessage
}