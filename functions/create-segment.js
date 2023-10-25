const AWS = require('aws-sdk')
const pinpoint = new AWS.Pinpoint()
const { env: { APP_ID } } = process

const createSegment = async (appId, userAttributeKey, userAttributeValue, name) => {
    const params = {
        ApplicationId: appId,
        WriteSegmentRequest: {
            Dimensions: {
                Attributes: {
                    [userAttributeKey]: {
                        Values: [userAttributeValue],
                        AttributeType: "CONTAINS"
                    }
                }
            },
            Name: name
        }
    };

    console.log('Creating segment at pinpoint', JSON.stringify(params))
    try {
        const createSegmentResponse = await pinpoint.createSegment(params).promise();
        console.log('createSegmentResponse', createSegmentResponse);
        return createSegmentResponse
    } catch (e) {
        console.log('e', e)
    }
}

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
    const { email = false } = event
    if (!email) {
        console.log('Invalid request provided, skipping update endpoint!')
    } else {
        await createSegment(APP_ID, 'agentEmail', event.email, event.email)
    }
    return
}