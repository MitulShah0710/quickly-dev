const { createCognitoUser } = require('../../libs/cognito-libs')

module.exports.handler = async (event) => {
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

    } catch (e) {
        console.log('Admin user create failed!', JSON.stringify(e))
        error = true
    }
}
