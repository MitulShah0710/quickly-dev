const { pinpointSendMessage } = require('../../libs/pinpoint-utility')
const fs = require('fs')

const getEmailContent = (templateName, templateLanguage, templateParams) => {
    const buffer = fs.readFileSync(`./functions/event-handlers/email/${templateLanguage}-${templateName}.html`);
    let fileContent = buffer.toString();

    for (var i = 0; i < templateParams.length; i++) {
        fileContent = fileContent.replace(new RegExp(`\\{\\{${i+1}\\}\\}`, 'g'), templateParams[i] )
    }

    return fileContent
}

const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))
    for (e of event.Records) {
        let body = JSON.parse(e.body)
        let message = JSON.parse(body.Message).details
        let template = null
        let tLang = null
        let subjects = null
        let subject = null
        let tParams = null
        switch(message.taskStatus) {
            case "ASSIGNED":
            case "ACCEPTED":
                template = "task_assigned_or_accepted"
                subjects = {
                    "en": "Delego: Your order has been assigned",
                    "es": "Delego: Tu orden ha sido assignada"
                }
                tLang = "en" // TODO: Should be read from Tenant's params maybe?
                subject = subjects[tLang]
                tParams = [
                   message.customerName,
                   message.visitDate,
                   message.taskDescription,
                   `${message.Agent.firstName} ${message.Agent.lastName}`
                ]
                break;

            case "IN_TRANSIT":
                template = "task_in_transit"
                subjects = {
                    "en": "Delego: Your order is on its way",
                    "es": "Delego: Tu order ya va en camino"
                }
                tLang = "en" // TODO: Should be read from Tenant's params maybe?
                subject = subjects[tLang]
                tParams = [
                   message.customerName,
                   message.visitDate,
                   message.taskDescription,
                   message.customerAddress
                ]
                break;

            case "ON_SITE":
                template = "task_on_site"
                subjects = {
                    "en": "Delego: Your order has arrived",
                    "es": "Delego: Tu orden ha llegado"
                }
                tLang = "en" // TODO: Should be read from Tenant's params maybe?
                subject = subjects[tLang]
                tParams = [
                   message.customerName,
                   message.visitDate,
                   message.taskDescription,
                   message.customerAddress
                ]
                break;

            case "COMPLETED":
            case "PARTIALLY_COMPLETED":
                template = "task_completed"
                subjects = {
                    "en": "Delego: Your order has been completed",
                    "es": "Delego: Tu orden ha sido completada"
                }
                tLang = "en" // TODO: Should be read from Tenant's params maybe?
                subject = subjects[tLang]
                tParams = [
                   message.customerName,
                   message.visitDate,
                   message.taskDescription,
                   message.orderID || message.ID
                ]
                break;

            case "REJECTED":
            case "CANCELLED":
                template = "task_cancelled"
                subjects = {
                    "en": "Delego: Your order has been canceled",
                    "es": "Delego: Tu orden ha sido cancelada"
                }
                tLang = "en" // TODO: Should be read from Tenant's params maybe?
                subject = subjects[tLang]
                tParams = [
                   message.customerName,
                   message.visitDate,
                   message.taskDescription,
                   message.orderID || message.ID
                ]
                break;

        }

        if (template) {
            let emailTemplate = getEmailContent(template, tLang, tParams)
            let response = await pinpointSendMessage(
                [message.customerEmail],
                subject,
                emailTemplate
            )
            console.log(`Email notification sent, response:${JSON.stringify(response)}`)

        } else {
            console.log('No email notification to send')
        }


    }


}

module.exports = { handler }