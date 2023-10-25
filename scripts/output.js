const fs = require("fs");

function handler (data, serverless, options) {
    const output = JSON.parse(JSON.stringify(data));
    console.log(output, "output");
    console.log(output.stage, "stage");
    // const obj = 
    const obj = {"awsconfig": {
        "aws_cognito_region": "us-east-1",
        "aws_user_pools_id": output.UserPoolID,
        "aws_user_pools_web_client_id": output.UserPoolClientID,
        "aws_appsync_graphqlEndpoint": output.GQAppURL,
        "aws_appsync_region": "us-east-1",
        "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
        "aws_appsync_apiKey": output[`Quicklyappsyncbe${output.stage}GraphQlApiKeyDefault`],
        "aws_cognito_identity_pool_id": output.IdentityPool,
        "aws_mandatory_sign_in": "enable",
        "clientMetadata": { "platform": "MOBILE_APP" },
        "Analytics": {
          "disabled": false,
          "autoSessionRecord": false,
          "AWSPinpoint": {
            "appId": output.PinpointApp,
            "region": "us-east-1",
            "bufferSize": 1000,
            "flushInterval": 5000,
            "flushSize": 100,
            "resendLimit": 5
          }
        },
        "Storage": {
          "AWSS3": {
            "bucket": `quickly-tasks-assets-${output.stage}`,
            "region": "us-east-1"
          }
        }
      },
      "analyticsConfig": {
        "AWSPinpoint": {
          "appId": output.PinpointApp,
          "region": "us-east-1"
        }
      },
      "publicUrl": `https://quickly-tasks-assets-${output.stage}.s3.amazonaws.com/public/`,
      "background_locationUrl": output.LocationUpdates
    }

    fs.writeFile('outputs.json', JSON.stringify(obj, null, 4), 'utf8', function (err) {
        console.log("error", err);
    });
    console.log('Received Stack Output', data)
}   
module.exports = { handler }