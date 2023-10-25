const middy = require('middy')
const { middleware } = require("../sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    const models = context.models
    const { WebUser } = models

    const { arguments, tenantHash } = event
    const { userID, newStatus } = arguments

    try {
        const webUserInfo = await WebUser.findOne({
            where: {
                TenantID: tenantHash,
                ID: userID
            }
        })

        console.log('Query results', JSON.stringify(webUserInfo))
        if (!webUserInfo) throw new Error('No user found for the given ID!')

        webUserInfo.status = newStatus

        await webUserInfo.save()

        return webUserInfo

    } catch (e) {
        console.log('Error at query', JSON.stringify(e))
        throw e
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }