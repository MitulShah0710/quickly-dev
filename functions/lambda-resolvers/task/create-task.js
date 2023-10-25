const middy = require('middy')
const moment = require('moment')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils')
const axios = require('axios');
const { env: { PRIVATE_API_ENDPOINT }} = process

// const handler = middy(async (event, context) => {
//     const requiredFields = ['name', 'autoAssignment', 'minCoverageRadius', 'maxCoverageRadius']
//     context.callbackWaitsForEmptyEventLoop = false
//     console.log('Incoming event', JSON.stringify(event))

//     const models = context.models
//     const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory } } = models
//     const { arguments, requesterUser, tenantHash } = event
//     const { info } = arguments

//     // const deliveryDetails = {}
//     // const pickupDetails = {}

//     // if(info.pickupAddress && info.pickupLatLongs) {
//     //     pickupDetails.pickupAddress = info.pickupAddress
//     //     pickupDetails.pickupLatLongs = info.pickupLatLongs

//     //     delete info.pickupAddress
//     //     delete info.pickupLatLongs
//     //     info.pickupDetails = pickupDetails
//     // }

//     // if(info.customerAddress && info.customerEmail && info.customerPhone && info.customerName && info.customerLatLongs) {
//     //     deliveryDetails.customerName = info.customerName
//     //     deliveryDetails.customerEmail = info.customerEmail
//     //     deliveryDetails.customerPhone = info.customerPhone
//     //     deliveryDetails.customerAddress = info.customerAddress
//     //     deliveryDetails.customerLatLongs = info.customerLatLongs

//     //     // delete info.customerName
//     //     // delete info.customerEmail
//     //     // delete info.customerPhone
//     //     // delete info.customerAddress
//     //     // delete info.customer
//     //     info.deliveryDetails = deliveryDetails
//     // }

//     //task model building
//     try {
//         // if (!info.pickupAddress) {
//         //     console.log('Invalid request')
//         //     throw new Error('pickupAddress is required!')
//         // }

//         // if (!info.pickupAddress && info.HubID) {
//         //     let hubData = await Hub.findOne({
//         //         where: {
//         //             ID: info.hub
//         //         }
//         //     })

//         //     info.pickupAddress = hubData.address
//         //     console.log('hubData as address', hubData)
//         // }
//         info.AgentID ? info.taskStatus = 'ASSIGNED' : null;
//         info.deliveryAddress = info.customerAddress
//         info.createdBy = requesterUser
//         info.TenantID = tenantHash
//         info.origin = tenantHash
//         info.executor = tenantHash
//         info.requestedDate ? info.plannedDate = info.requestedDate : null;
//         // info.serviceTime = new Date().getTime()
//         info.visitDate = moment().format('YYYY-MM-DD')
//         info.visitTimeWindow = [moment().format('YYYY-MM-DDT00:00:000Z'), moment().format('YYYY-MM-DDT23:59:000Z')]

//         let task = await Task.create({
//             ...info,
//         })

//         await TaskHistory.create({
//             TenantID: tenantHash,
//             TaskID: task.ID,
//             // timestamp: new Date().getTime(),
//             status: task.taskStatus,
//             changedBy: task.createdBy
//         })

//         const associations = {}
//         associations.Team = await task.getTeam()
//         associations.Agent = await task.getAgent()
//         associations.TaskType = await task.getTaskType()
//         associations.TaskHistories = await task.getTaskHistories()


//         console.log('task saved on db')
//         return {...task.toJSON(), ...associations }

//     } catch (e) {
//         console.log('error caught', JSON.stringify(e))
//         throw e
//     }
// })

const handler = middy(async (event, context) => {
    const requiredFields = ['name', 'autoAssignment', 'minCoverageRadius', 'maxCoverageRadius']
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { info } = arguments

    // const deliveryDetails = {}
    // const pickupDetails = {}

    // if(info.pickupAddress && info.pickupLatLongs) {
    //     pickupDetails.pickupAddress = info.pickupAddress
    //     pickupDetails.pickupLatLongs = info.pickupLatLongs

    //     delete info.pickupAddress
    //     delete info.pickupLatLongs
    //     info.pickupDetails = pickupDetails
    // }

    // if(info.customerAddress && info.customerEmail && info.customerPhone && info.customerName && info.customerLatLongs) {
    //     deliveryDetails.customerName = info.customerName
    //     deliveryDetails.customerEmail = info.customerEmail
    //     deliveryDetails.customerPhone = info.customerPhone
    //     deliveryDetails.customerAddress = info.customerAddress
    //     deliveryDetails.customerLatLongs = info.customerLatLongs

    //     // delete info.customerName
    //     // delete info.customerEmail
    //     // delete info.customerPhone
    //     // delete info.customerAddress
    //     // delete info.customer
    //     info.deliveryDetails = deliveryDetails
    // }

    //task model building
    try {
        // if (!info.pickupAddress) {
        //     console.log('Invalid request')
        //     throw new Error('pickupAddress is required!')
        // }

        // if (!info.pickupAddress && info.HubID) {
        //     let hubData = await Hub.findOne({
        //         where: {
        //             ID: info.hub
        //         }
        //     })

        //     info.pickupAddress = hubData.address
        //     console.log('hubData as address', hubData)
        // }
        const taskInvite = 'UNSENT'
        info.customerLatLongs ? null : info.taskStatus = 'INVALID_LOCATION' ;
        info.AgentID ? info.taskStatus = 'ASSIGNED' : null;
        info.invalidLocation ? info.taskStatus = 'INVALID_LOCATION' : null;
        info.deliveryAddress = info.customerAddress
        info.createdBy = requesterUser
        info.TenantID = tenantHash
        info.origin = tenantHash
        info.executor = tenantHash
        info.requestedDate ? info.plannedDate = info.requestedDate : null;
        info.taskInvite = taskInvite;
        // info.serviceTime = new Date().getTime()
        info.visitDate = moment().format('YYYY-MM-DD')
        info.visitTimeWindow = [moment().format('YYYY-MM-DDT00:00:000Z'), moment().format('YYYY-MM-DDT23:59:000Z')]

        let task = await Task.create({
            ...info,
        })

        // await TaskHistory.create({
        //     TenantID: tenantHash,
        //     TaskID: task.ID,
        //     // timestamp: new Date().getTime(),
        //     status: task.taskStatus,
        //     changedBy: task.createdBy
        // })

        const associations = {}
        associations.Team = await task.getTeam()
        associations.Agent = await task.getAgent()
        associations.TaskType = await task.getTaskType()
        associations.TaskHistories = await task.getTaskHistories()

        console.log('task saved on db')

        if (associations.Team.autoAssignment && task.taskMode === 'IMMEDIATE') {
            console.log(`Auto-assigning Task ${task.ID}`)
            const tenant = await task.getTenant()
            let maxTravelTimeMinutes = tenant.configs.driving_times.map(a => a*60)
            console.log(`maxTravelTimes: ${maxTravelTimeMinutes}`)
            await axios.post(`${PRIVATE_API_ENDPOINT}/auto-assignment`, {
                task: {
                    id: task.ID,
                    latlong:[{
                        lat: task.customerLatLongs.lat,
                        lng: task.customerLatLongs.long
                    }],
                    teamId: associations.Team.ID
                },
                config: {
                    maxTravelTimes: maxTravelTimeMinutes,
                    waitTime: tenant.configs.waiting_time_between_invites,
                    maxTasksPerAgent: tenant.configs.max_tasks_per_agent
                },
                tenantHash: tenantHash
            })
            .then(function (response) {
                console.log('POST auto-assignment response', response);
            })
            .catch(function (error) {
                console.log('POST auto-assignment error', error);
            });
        }

        // Send event to SNS
        await axios.post(`${PRIVATE_API_ENDPOINT}/task-events`, {
            attributes: {
                entity: "TASK",
                event: task.taskStatus,
                notifications: ['WA', 'EMAIL'] // Should read from Tenant data
            },
            details: task.toJSON()
        }, {
            headers: {
                'InvocationType': 'Event'
            }
        })
        .then(function (response) {
            console.log('axios task-events response', response);
        })
        .catch(function (error) {
            console.log('axios task-events error', error);
        });

        return {...task.toJSON(),taskInvite, ...associations }

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
