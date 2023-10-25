const middy = require('middy');
const { middleware } = require("./lambda-resolvers/sequelize-middleware");

const handler = middy(async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))

    return {
        success: true
    }
})

handler.use({
    before: middleware
})


module.exports = { handler }