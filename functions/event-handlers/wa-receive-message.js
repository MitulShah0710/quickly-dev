const axios = require('axios')

const handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    console.log('Incoming event', JSON.stringify(event))
}

module.exports = { handler }