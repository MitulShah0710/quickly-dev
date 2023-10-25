module.exports = {
    updateObjectProperty: (updateValues, objectToUpdate) => {
        Object.keys(updateValues).map(k => {
            objectToUpdate[k] = updateValues[k]
        })
        return objectToUpdate
    },
    requestFilter: (request, requiredFields = []) => {
        console.log('Incoming request', request)
        const staticKeysObject = {}
        requiredFields.map(f => {
            if (Object.keys(request).includes(f)) {
                staticKeysObject[f] = request[f]
            }
        })
        return staticKeysObject
    }
    
}