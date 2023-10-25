const middy = require('middy');
const { Op } = require('sequelize');
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType } } = models

    const { arguments, agentID } = event
    const { limit = 5, offset = 0, status = false } = arguments

    const { tenantHash } = event
    const whereClause = {}

    whereClause.TenantID = tenantHash
    whereClause.AgentID = agentID
    // whereClause.limit = limit
    // whereClause.offset = offset

    // status !== false ? whereClause.taskStatus = status : null;
    // whereClause.taskStatus = 'ACCEPTED' || whereClause.taskStatus = 'ACCEPTED'

    console.log("WHERECLAUSE", whereClause);

    try {
        const { rows, count } = await Task.findAndCountAll({
            where: {
                ...whereClause, 
                [Op.or]: [
                { taskStatus: 'ON_SITE' },
                { taskStatus: 'ACCEPTED' },
                { taskStatus: 'ASSIGNED' },
                { taskStatus: 'IN_TRANSIT' },
            ]},
            limit,
            offset,
            include: [
                {
                    model: Agent,
                },
                {
                    model: Team,
                },
                {
                    model: TaskHistory
                },
                {
                    model: TaskType
                }
                
            ],
            order: [
                [{ model: TaskHistory }, 'createdAt', 'DESC' ]
            ],
            limit,
            offset
        })
        console.log('Task info', JSON.stringify(rows))

        if (count !== 0) {
            console.log("if");
            return {
                tasks: rows,
                count
            }
        }
        else {
            console.log('No tasks with the tenant')
            return {
                tasks: rows,
                count,
                total: count
            }
        }
    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }