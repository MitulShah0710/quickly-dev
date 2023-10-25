const AWS = require('aws-sdk')
const Pinpoint = new AWS.Pinpoint()
const { PINPOINT_APP, PINPOINT_EMAIL_TEMP } = process.env

const pinpointSendMessage = async (toAddresses = [], subject = '', obj) => {
    var link1 = obj.link;
    try {const param = {
        ApplicationId: PINPOINT_APP,
        MessageRequest: {
            Addresses: {},
            TemplateConfiguration: {
                EmailTemplate: {
                    Name: PINPOINT_EMAIL_TEMP
                  },
            },
            MessageConfiguration: {
                EmailMessage: {
                    FromAddress: 'carlos.hernandez@intelligisgroup.com',
                    Substitutions: {
                        link: [
                            `${link1}`
                        ],
                        subject: [
                            'Quickly Email Verification'
                        ]
                    },
                },
            }
        }
    };
    toAddresses.map(e => {
        param.MessageRequest.Addresses[e] = { ChannelType: 'EMAIL' }
    })

    console.log('Pinpoint send message params', JSON.stringify(param))
    const response = await Pinpoint.sendMessages(param).promise()
    return response
    }
    catch (error) {
        console.log("Template error", error)
    }
}

module.exports = {
    pinpointSendMessage
}