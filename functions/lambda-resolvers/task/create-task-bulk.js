const middy = require('middy')
const moment = require('moment')
const { middleware } = require("../sequelize-middleware");
const { requestFilter } = require('../../libs/utils')
const axios = require('axios');
const { Op } = require("sequelize");
const { env: { PRIVATE_API_ENDPOINT }} = process

const handler = middy(async (event, context) => {
    const requiredFields = ['name', 'autoAssignment', 'minCoverageRadius', 'maxCoverageRadius']
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory } } = models
    const { arguments, requesterUser, tenantHash } = event

    try {
        const taskInvite = 'UNSENT'
        let info = arguments.info

        for (let elem of info) {
            elem.customerLatLongs ? null : elem.taskStatus = 'INVALID_LOCATION' ;
            elem.AgentID ? elem.taskStatus = 'ASSIGNED' : null;
            elem.invalidLocation ? elem.taskStatus = 'INVALID_LOCATION' : null;
            elem.deliveryAddress = elem.customerAddress
            elem.createdBy = requesterUser
            elem.TenantID = tenantHash
            elem.origin = tenantHash
            elem.executor = tenantHash
            elem.requestedDate ? elem.plannedDate = elem.requestedDate : null;
            elem.taskInvite = taskInvite;
            // elem.serviceTime = new Date().getTime()
            elem.visitDate = moment().format('YYYY-MM-DD')
            elem.visitTimeWindow = [moment().format('YYYY-MM-DDT00:00:000Z'), moment().format('YYYY-MM-DDT23:59:000Z')]
        }

        // Save Tasks in DB
        let createdTasks = await Task.bulkCreate(info)
        console.log('tasks saved on db')

        // const associations = {}
        // associations.Team = await task.getTeam()
        // associations.Agent = await task.getAgent()
        // associations.TaskType = await task.getTaskType()
        // associations.TaskHistories = await task.getTaskHistories()

        // Retrieve Teams info
        let teamIds = new Set(createdTasks.map(t => t.TeamID))
        let teams = await Team.findAll({
            where: {
                ID: Array.from(teamIds)
            }
        });
        const tenant = await createdTasks[0].getTenant()

        for (let task of createdTasks) {
            let team = teams.filter(t => t.ID === task.TeamID)[0]

            if (team.autoAssignment && task.taskMode === 'IMMEDIATE') {
                console.log(`Auto-assigning Task ${task.ID}`)
                let maxTravelTimeMinutes = tenant.configs.driving_times.map(a => a*60)
                console.log(`maxTravelTimes: ${maxTravelTimeMinutes}`)
                await axios.post(`${PRIVATE_API_ENDPOINT}/auto-assignment`, {
                    task: {
                        id: task.ID,
                        latlong:[{
                            lat: task.customerLatLongs.lat,
                            lng: task.customerLatLongs.long
                        }],
                        teamId: team.ID
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

        }

        return createdTasks

    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
