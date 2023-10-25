const AWS = require('aws-sdk')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const documentClient = new DynamoDB.DocumentClient()
const { sendResponse } = require('../../libs/api-gateway-libs')
const { env: { CUSTOM_FILTER_DB} } = process

  module.exports.handler = async (event,context) => {
      context.callbackWaitsForEmptyEventLoop = false
      console.log('Incoming event', JSON.stringify(event));
      console.log('Incoming context', JSON.stringify(context));
      const { arguments, requester } = event;
      //get the row from dynamodb based on customFilterId and hashVal
      console.log(arguments)
      var params = {
        TableName : CUSTOM_FILTER_DB,
        Key: {
            userId: requester,
            filterId:arguments.filterId
        }
      };
      try {
        
        const data = await documentClient.get(params).promise()
        console.log("Success")
        console.log(data)
        var filter={};
        if (!data) {
          console.log('There is no tenant mapped to provided api key')
          return sendResponse(400, { Error: 'Invalid apikey!' })
        }else{ 
          console.log("Success xxxxx")
          console.log(data.Item)
          filter={
            ID:data.Item.filterId,
            userId:data.Item.userId,
            filterContent:data.Item.filterContent
          }

        }
        console.log("conslta dynamo==",filter);
        return filter;
    } catch (err) {
        console.log("Failure", err.message)
        // there is no data here, you can return undefined or similar
    }
    
}



