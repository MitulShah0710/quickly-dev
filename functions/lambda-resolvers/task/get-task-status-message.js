const { toLower } = require('lodash');
const middy = require('middy');
const { Op } = require('sequelize');
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { models: { Team, Hub, WebUser, Agent, Task, TaskHistory, TaskType, Message } } = models
    const { arguments, requesterUser, tenantHash } = event
    const { limit = 500, offset = 0, messageID = false, status=false, languageCode=false, taskTypeID=false } = arguments

    try {
        if (messageID) {
            const message = await Message.findOne({
                where: {
                    TenantID: tenantHash,
                    ID: messageID
                },
                limit,
                offset
            })

            return {
                messages: [message],
                count: 1
            }
        } else {
            const paramQuery = {
                where: {
                    TenantID: tenantHash
                },
                include: {}
            }

            if(status) {
                paramQuery.where.status = status
            }
            
            if(languageCode) {
                // let languageCode1 = languageCode.toLowerCase()
                // console.log(languageCode1, "LANGUAGECODE1");
                paramQuery.where.language = {
                    [Op.iLike]: `${languageCode}%`
                  }
            } else {
                paramQuery.where.language = 'en'
            }

            if(taskTypeID) {
                paramQuery.include.model = TaskType
                paramQuery.include.where = {}
                paramQuery.include.where.ID = taskTypeID
            }

            paramQuery.limit = limit
            paramQuery.offset = offset
            console.log(paramQuery);
            const { rows, count } = await Message.findAndCountAll(paramQuery)

            return {
                messages: rows,
                count
            }
        }


    } catch (e) {
        console.log('error caught', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }
