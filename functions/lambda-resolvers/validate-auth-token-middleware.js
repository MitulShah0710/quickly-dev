module.exports.validateAuthToken = async (handler, next) => {
    console.log('Incoming event at auth token validator middleware', JSON.stringify(handler.event))
    const { tenantHash } = handler.event
    if(!tenantHash) {
        console.log('Invalid request detected! missing tenant hash parameter!')
        throw new Error("Tenant Hash missing in request!")
    }
    return
}