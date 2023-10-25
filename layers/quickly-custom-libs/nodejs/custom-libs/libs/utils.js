module.exports = {
    updateObjectProperty: (updateValues, objectToUpdate) => {
        Object.keys(updateValues).map(k => {
            objectToUpdate[k] = updateValues[k]
        })
        return objectToUpdate
    }
}