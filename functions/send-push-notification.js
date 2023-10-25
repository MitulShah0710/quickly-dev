const AWS = require('aws-sdk')
const pinpoint = new AWS.Pinpoint()
const { env: { APP_ID } } = process

const createCampaign = async (appId, body, title, name, segmentId) => {
    const params = {
        ApplicationId: appId /* required */,
        WriteCampaignRequest: {
            /* required */
            MessageConfiguration: {
                // APNSMessage: {
                //     Action: body.action,
                //     Body: body.body,
                //     Title: body.title,
                //     Url: body.url,
                //     JsonBody: body.jsonBody
                // },
                GCMMessage: {
                    Action: 'OPEN_APP',
                    Body: body,
                    Title: title,
                    Url: '',
                    JsonBody: ''
                }
            },
            Name: name,
            Schedule: {
                StartTime: 'IMMEDIATE',
                Frequency: "ONCE",
                IsLocalTime: false,
                QuietTime: {},
                Timezone: "UTC"
            },
            SegmentId: segmentId
        }
    };

    console.log('Campaign created ->', JSON.stringify(params))
    try {
        const createCampaignResponse = await pinpoint.createCampaign(params).promise();
        console.log('createCampaignResponse', createCampaignResponse);
        return createCampaignResponse
    } catch (err) {
        console.log('err', err)
        return
    }

}

const getSegment = async (appId, name) => {
    try {
        const segments = await pinpoint.getSegments({
            ApplicationId: appId
        }).promise()

        let temp = []
        segments.SegmentsResponse.Item.map(e => {
            if(e.Name === name) {
                temp.push(e.Id)
            }
        });
        return temp;
    } catch (e) {
        console.log('e', e)
        return
    }
}

const agentNotificationHandler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
    const { email, payload: { title, body } } = event

    const segmentID = await getSegment(APP_ID, email)
    console.log('segment ID is ', JSON.stringify(segmentID))
    //need to add check if no segment id then break the code

    const notificationResult = await createCampaign(APP_ID, body, title, `${new Date().getTime()}`, segmentID[0])
    console.log('notification delivery result', JSON.stringify(notificationResult))
}

const teamNotificationHandler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
}

module.exports = {
    agentNotificationHandler,
    teamNotificationHandler
}