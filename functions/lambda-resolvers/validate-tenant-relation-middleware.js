const { getUser } = require('../libs/cognito-libs')

module.exports.validateTenantRelation = async (handler, next) => {
    const { arguments, tenantHash, user } = handler.event
    const { userID, newStatus, agentID } = arguments

    let userData = {}
    try {
        userData = await getUser(userID || agentID)
        console.log('user info found!', JSON.stringify(userData))
    } catch (e) {
        console.log('Error at admin get user', JSON.stringify(e))
        // return handler.callback(e, null)
        throw e
    }

    const userAttrs = userData.UserAttributes || []
    const userTenantID = userAttrs.find(e => e.Name === 'custom:TENANT_HASH')
    
    if(tenantHash !== userTenantID.Value) {
        // return handler.callback('No user found with given ID!', null)
        throw new Error('No user found with given ID!')
    } else {
        return
    }

}