module.exports = {
    sendResponse: (statusCode, body, contentType='application/json') => {
        const response = {
            statusCode,
            headers: {
                'Access-Control-Allow-Origin': "*",
                'Access-Control-Allow-Credentials': true,
                'Content-Type': contentType
            },
            body: body 
        }
        if (contentType === 'application/json') {
            response.body = JSON.stringify(response.body)
        }
        console.log('Sending response with ', JSON.stringify(response))
        return response
    }
}