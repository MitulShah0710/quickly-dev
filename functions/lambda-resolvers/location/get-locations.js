const middy = require('middy');
const { Op } = require("sequelize");
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { Location} = models

    const { arguments, tenantHash } = event
    const { limit = 10, offset = 0, phone =null, name = null } = arguments

    const where = {
        TenantID: tenantHash
    }

    if (phone) {
        where.phone = {
            [Op.startsWith]: phone,
        }
    }

    if (name) {
        where.name = {
            [Op.iLike]: name+'%',
        }
    }

    try {
        const { rows, count } = await Location.findAndCountAll({
            where,
            limit,
            offset
        })
        console.log('Location info', JSON.stringify(rows))

        return {
            locations: rows || [],
            total: count,
            page: offset,
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