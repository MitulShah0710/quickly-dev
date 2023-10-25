const middy = require('middy');
const { middleware } = require("../sequelize-middleware");
const { Op, Sequelize } = require('sequelize')

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType } } = models

    const { arguments } = event
    const { teamID, dateFilter = false, status = false, agentID = false, orderID = false } = arguments

    const { tenantHash } = event
    const where = {
        TenantID: tenantHash,
        TeamID: teamID
    }

    if (dateFilter) {
        where[dateFilter['dateField']] = { [Op.between]: [dateFilter.fromDate, dateFilter.toDate] }
    }

    if (status) {
        where.taskStatus = status
    }

    if(agentID) {
        where.AgentID = agentID
    }

    if(orderID) {
        // where.orderID = Sequelize.where(Sequelize.fn('LOWER', sequelize.col('orderID')), 'LIKE', `%${orderID}%`)
        where.orderID = { 
            [Op.iLike]: `%${orderID}%`  
        }
    }

    console.log('where clause', JSON.stringify(where))
    try {
        const { rows, count } = await Task.findAndCountAll({
            where,
            include: [
                {
                    model: Agent,
                },
                {
                    model: Team,
                },
                {
                    model: TaskHistory,
                },
                {
                    model: TaskType,
                }
            ]
        })
        console.log('Task info', JSON.stringify({ rows, count }))

        return {
            tasks: rows,
            count
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