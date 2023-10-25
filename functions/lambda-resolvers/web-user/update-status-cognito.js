const { disableUser, enableUser } = require('../../libs/cognito-libs')
const middy = require('middy')
const { validateTenantRelation } = require('../validate-tenant-relation-middleware')

const handler = middy(async (event) => {
    console.log('Incoming event', JSON.stringify(event))

    const { arguments, tenantHash, user } = event
    const { userID, newStatus } = arguments

    let error = false
    try {
        if (newStatus === 'ACTIVE') {
            await enableUser(userID)
        } else {
            await disableUser(userID)
        }
    } catch (e) {
        console.log('Error at disabling user', JSON.stringify(e))
        error = true
    }

    console.log('user status updated at cognito!')

    return {
        userStatusUpdated: error === false ? true : false
    }
})

handler.use({
    before: validateTenantRelation
})

module.exports = { handler }
