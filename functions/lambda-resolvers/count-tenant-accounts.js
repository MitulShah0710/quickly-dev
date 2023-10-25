const DynamoDB = require('aws-sdk/clients/dynamodb')
const docClient = new DynamoDB.DocumentClient()
const { env: { CATALOG_DB } } = process

const recursiveQuery = (status, data = [], LastEvaluatedKey = false) => {
    console.log('Function called with ', LastEvaluatedKey)
    const param = {
        TableName: CATALOG_DB,
        IndexName: 'status-index',
        KeyConditions: {
            status: {
                ComparisonOperator: 'EQ',
                AttributeValueList: [status]
            }
        },
        ProjectionExpression: 'contactEmail'
    }

    if (LastEvaluatedKey) {
        param.ExclusiveStartKey = LastEvaluatedKey
    }

    return docClient.query(param).promise()
        .then(response => {
            data = [...data, ...response.Items]
            if (response.LastEvaluatedKey) {
                return recursiveQuery(status, data, response.LastEvaluatedKey)
            } else {
                return data
            }
        })
}

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
    const { status } = event

    const data = await recursiveQuery(status) || []
    console.log('Data after process', JSON.stringify(data))

    return data.length
}
