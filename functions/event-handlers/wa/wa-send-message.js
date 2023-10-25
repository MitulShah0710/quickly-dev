const WhatsappCloudAPI = require('./index.js');

const Whatsapp = new WhatsappCloudAPI({
    accessToken: process.env.WA_accessToken,
    senderPhoneNumberId: process.env.WA_SenderPhoneNumberId,
    WABA_ID: process.env.WA_wabaId,
});

const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))
    for (e of event.Records) {
        let body = JSON.parse(e.body)
        let message = JSON.parse(body.Message).details
        let template = null
        let tLang = null
        let tParams = null
        switch(message.taskStatus) {
            case "ASSIGNED":
            case "ACCEPTED":
                template = "task_assigned_or_accepted"
                tLang = "en_US" // TODO: Should be read from Tenant's params maybe?
                tParams = [
                    {
                        type: "text",
                        text: message.customerName
                    },
                    {
                        type: "text",
                        text: message.visitDate
                    },
                    {
                        type: "text",
                        text: message.taskDescription
                    },
                    {
                        type: "text",
                        text: `${message.Agent.firstName} ${message.Agent.lastName}`
                    }
                ]
                break;

            case "IN_TRANSIT":
                template = "task_in_transit"
                tLang = "en_US" // TODO: Should be read from Tenant's params maybe?
                tParams = [
                    {
                        type: "text",
                        text: message.customerName
                    },
                    {
                        type: "text",
                        text: message.visitDate
                    },
                    {
                        type: "text",
                        text: message.taskDescription
                    },
                    {
                        type: "text",
                        text: message.customerAddress
                    }
                ]
                break;

            case "ON_SITE":
                template = "task_on_site"
                tLang = "en_US" // TODO: Should be read from Tenant's params maybe?
                tParams = [
                    {
                        type: "text",
                        text: message.customerName
                    },
                    {
                        type: "text",
                        text: message.visitDate
                    },
                    {
                        type: "text",
                        text: message.taskDescription
                    },
                    {
                        type: "text",
                        text: message.customerAddress
                    }
                ]
                break;

            case "COMPLETED":
            case "PARTIALLY_COMPLETED":
                template = "task_completed"
                tLang = "en_US" // TODO: Should be read from Tenant's params maybe?
                tParams = [
                    {
                        type: "text",
                        text: message.customerName
                    },
                    {
                        type: "text",
                        text: message.visitDate
                    },
                    {
                        type: "text",
                        text: message.taskDescription
                    },
                    {
                        type: "text",
                        text: message.orderID || message.ID
                    }
                ]
                break;

            case "REJECTED":
            case "CANCELLED":
                template = "task_cancelled"
                tLang = "en_US" // TODO: Should be read from Tenant's params maybe?
                tParams = [
                    {
                        type: "text",
                        text: message.customerName
                    },
                    {
                        type: "text",
                        text: message.visitDate
                    },
                    {
                        type: "text",
                        text: message.taskDescription
                    },
                    {
                        type: "text",
                        text: message.orderID || message.ID
                    }
                ]
                break;

        }

        if (template) {
            let response = await Whatsapp.sendTemplate({
                recipientPhone: message.customerPhone,
                templateName: template,
                templateLanguage: tLang,
                templateParams: tParams
             })
             console.log(`Notification sent, response:${JSON.stringify(response)}`)

        } else {
            console.log('No notification to send')
        }


    }


}

module.exports = { handler }