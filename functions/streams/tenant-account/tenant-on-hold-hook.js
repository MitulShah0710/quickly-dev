const AWS = require('aws-sdk')
const _ = require('lodash')
const { env: { UPDATE_POSTGRES_LAMBDA_ARN } } = process
const lambda = new AWS.Lambda()

module.exports.onHoldHook = async (NewItem, OldImage) => {
    console.log('On hold hook detected!', JSON.stringify(NewItem))

    const FieldsToUpdate = {}
    FieldsToUpdate.ON_HOLD = NewItem.ON_HOLD

    const where = {}
    where.ID = NewItem.ID

    const updatePostgres = await lambda.invokeAsync({
        FunctionName: UPDATE_POSTGRES_LAMBDA_ARN,
        InvokeArgs: JSON.stringify({ where, update: FieldsToUpdate })
    }).promise()

    console.log('Call results', JSON.stringify(updatePostgres))
    return true
}