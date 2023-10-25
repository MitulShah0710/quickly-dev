const middy = require('middy')
const { createCognitoUser, addUserToGroup } = require('../../libs/cognito-libs')
const { validateAuthToken } = require('../validate-auth-token-middleware')
const axios = require('axios')

const handler = middy(async (event) => {
    console.log('Incoming event', JSON.stringify(event))

    const { arguments, tenantHash, user } = event
    const { info } = arguments
    const { email, firstName, lastName, userType } = info

    let error = false
    let userInfo = {}
    try {
        userInfo = await createCognitoUser(email, email, tenantHash)
            .then(d => {
                console.log('newly created user', JSON.stringify(d))
                return d.User
            })
            .catch(e => {
                throw e
            })

    } catch (e) {
        console.log('Admin user create failed!', JSON.stringify(e))
        throw e
    }


    try {
        if (userType === 'TENANT_ADMIN') {
            await addUserToGroup('TenantAdmin', email)
                .then(d => console.log('TenantAdmin result success', JSON.stringify(d)))
        } else if (userType === 'DISPATCHER') {
            await addUserToGroup('TenantWebUser', email)
                .then(d => console.log('TenantWebUser result success', JSON.stringify(d)))
        } else {
            await addUserToGroup('TenantDriver', email)
                .then(d => console.log('TenantDriver result success', JSON.stringify(d)))
        }

        await addUserToGroup(`TENANT_${tenantHash}`, email)
            .then(d => console.log(`TENANT_${tenantHash} result success`, JSON.stringify(d)))

    } catch (e) {
        console.log('Failed to add user in tenant specific groups', JSON.stringify(e))
        throw e
    }

    return {
        info,
        userCreated: error === false ? true : false,
        userID: userInfo.Username
    }
})

handler.use({
    before: validateAuthToken
})

module.exports = { handler }

