const AWS = require('aws-sdk')
const moment = require('moment')
const docClient = new AWS.DynamoDB.DocumentClient()
const lambda = new AWS.Lambda()
const { pinpointSendMessage } = require('../../libs/pinpoint-utility')
const fs = require('fs')
const { createTenantGroup, createCognitoUser, addUserToGroup, listUsersInGroupRecursive } = require('../../libs/cognito-libs')
const { initEmailValidationHook } = require('./init-email-validation-hook')
const { initReadyWorkHook } = require('./init-ready-work-hook')
const { rejectedHook } = require('./rejected-hook')
const { onHoldHook } = require('./tenant-on-hold-hook')
const { createApiKey, addApiKeyToUsagePlan, getApiUsagePlans } = require('../../libs/api-gateway-libs')

const { API_URL, CATALOG_DB, AUDIT_LOGS_DB, DEFAULT_USAGE_PLAN} = process.env

const formatAdminEmail = (tenantObj) => {
    const adminEmail = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Quickly</title>
        </head>
        <body>
            <h1>New Tenant Account Created</h1>
            <p>below are the details of new tenant.</p>
            <ul>
                <li>Contact name: #CONTACT_NAME#</li>
                <li>Contact email: #CONTACT_EMAIL#</li>
                <li>Business name: #BUSINESS_NAME#</li>
                <li>Address: #ADDRESS#</li>
                <li>Country: #COUNTRY#</li>
                <li>Postal code: #ZIPCODE#</li>
                <li>Average monthly orders: #MONTHLY-ORDERS#</li>
                <li>Average drivers: #AVERAGE-DRIVERS#</li>
            </ul>
        </body>
        </html>
    `

    let formatedEmail = adminEmail.replace(/#CONTACT_NAME#/g, tenantObj.contactFirstName || '' + ' ' + tenantObj.contactLastName || '')
    formatedEmail = formatedEmail.replace(/#CONTACT_EMAIL#/g, tenantObj.contactEmail || '')
    formatedEmail = formatedEmail.replace(/#BUSINESS_NAME#/g, tenantObj.businessName || '')
    formatedEmail = formatedEmail.replace(/#ADDRESS#/g, tenantObj.address || '')
    formatedEmail = formatedEmail.replace(/#COUNTRY#/g, tenantObj.country || '')
    formatedEmail = formatedEmail.replace(/#ZIPCODE#/g, tenantObj.zipCode || '')
    formatedEmail = formatedEmail.replace(/#MONTHLY-ORDERS#/g, tenantObj.averageMonthlyOrders || '')
    formatedEmail = formatedEmail.replace(/#AVERAGE-DRIVERS#/g, tenantObj.averageDrivers || '')

    return formatedEmail
}
const asyncMap = async (list = [], callback) => {
    return Promise.all(list.map(async e => callback(e)))
}

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))

    return asyncMap(event.Records, async (row) => {
        console.log('Processing ', JSON.stringify(row))
        const NewItem = AWS.DynamoDB.Converter.unmarshall(row.dynamodb.NewImage)
        const OldImage = AWS.DynamoDB.Converter.unmarshall(row.dynamodb.OldImage)

        console.log('newItem oldImage', JSON.stringify(NewItem), JSON.stringify(OldImage))
        const currentStatus = NewItem.status
        const oldStatus = OldImage.status

        //initial hooks
        if (currentStatus === 'INIT_EMAIL_VALIDATION' && oldStatus !== 'INIT_EMAIL_VALIDATION') {
            await initEmailValidationHook(NewItem)
        } else if (currentStatus === 'INIT_QUIK_VALIDATION' && oldStatus !== 'INIT_QUIK_VALIDATION') {
            const adminUsers = await listUsersInGroupRecursive('SuperAdmin')
            const adminUserEmails = []
            adminUsers.map(user => {
                const { Attributes } = user
                Attributes.map(e => {
                    if (e.Name === 'email') {
                        adminUserEmails.push(e.Value)
                    }
                })
            })

            await docClient.put({
                TableName: AUDIT_LOGS_DB,
                Item: {
                    year: moment().format('Y'),
                    eventTime: `${new Date().getTime()}#TENANT_VALIDATED`,
                    log: NewItem
                }
            }).promise()
                .then(d => console.log('audit log added for TENANT_VALIDATED!'))
                .catch(e => {
                    console.log('Error in audit log TENANT_VALIDATED!', JSON.stringify(e))
                })

            await pinpointSendMessage(adminUserEmails, 'New Tenant Account Created', formatAdminEmail(NewItem))

        } else if (currentStatus === 'INIT_READY_WORK' && oldStatus !== 'INIT_READY_WORK') {
            // creating API Key for tenant and associate it to usage plan
            const apiKey = await createApiKey(NewItem.id)
            const usagePlans = await getApiUsagePlans()
            // console.log('usagePlans', JSON.stringify(usagePlans))
            let tenantUsagePlan = usagePlans.items.filter(u => u.name === DEFAULT_USAGE_PLAN)
            // console.log('tenantUsagePlan', JSON.stringify(tenantUsagePlan))
            try{
                await addApiKeyToUsagePlan(apiKey.id, tenantUsagePlan.id)
            }catch(err){
                console.error('Failed to create API Usage Plan with Key Association', err);
            }

            NewItem.apiKeyId = apiKey.id
            NewItem.apiKeyValue = apiKey.value

            await initReadyWorkHook(NewItem)

            await docClient.update({
                TableName: CATALOG_DB,
                Key: {
                    id: NewItem.id,
                },
                UpdateExpression: 'SET #apiKeyId = :apiKeyId, #apiKeyValue = :apiKeyValue',
                ExpressionAttributeNames: {
                    '#apiKeyId': 'apiKeyId',
                    '#apiKeyValue': 'apiKeyValue'
                },
                ExpressionAttributeValues: {
                    ':apiKeyId': apiKey.id,
                    ':apiKeyValue': apiKey.value
                },
                ReturnValues: 'ALL_NEW'
            }).promise()
                .then(d => console.log('Updated Api Key in CATALOG_DB!'))
                .catch(e => {
                    console.log('Error updated Api Key in CATALOG_DB', JSON.stringify(e))
                })

            await docClient.put({
                TableName: AUDIT_LOGS_DB,
                Item: {
                    year: moment().format('Y'),
                    eventTime: `${new Date().getTime()}#TENANT_APPROVED`,
                    log: NewItem
                }
            }).promise()
                .then(d => console.log('audit log added for TENANT_VALIDATED!'))
                .catch(e => {
                    console.log('Error in audit log TENANT_VALIDATED!', JSON.stringify(e))
                })

        } else if (currentStatus === 'REJECTED' && oldStatus !== 'REJECTED') {
            await rejectedHook(NewItem)
            await docClient.put({
                TableName: AUDIT_LOGS_DB,
                Item: {
                    year: moment().format('Y'),
                    eventTime: `${new Date().getTime()}#TENANT_REJECTED`,
                    log: NewItem
                }
            }).promise()
                .then(d => console.log('audit log added for TENANT_VALIDATED!'))
                .catch(e => {
                    console.log('Error in audit log TENANT_VALIDATED!', JSON.stringify(e))
                })
        }

        //checking for tenant on hold hook
        if (currentStatus === 'INIT_READY_WORK' && oldStatus === 'INIT_READY_WORK') {
            console.log('if enters working tenant not a first event')
            if (NewItem.ON_HOLD === true && OldImage.ON_HOLD !== true) {
                console.log('Detected on hold')
                await onHoldHook(NewItem, OldImage)
            } else if (NewItem.ON_HOLD === false && OldImage.ON_HOLD !== false) {
                console.log('Detected on hold removed')
                await onHoldHook(NewItem, OldImage)
            }
        }

        return

    })
}

