const { APIGatewayClient, CreateApiKeyCommand, DeleteApiKeyCommand,
    CreateUsagePlanKeyCommand, DeleteUsagePlanKeyCommand, GetUsagePlansCommand } = require("@aws-sdk/client-api-gateway");
const client = new APIGatewayClient({ region: "us-east-1" });

module.exports = {
    sendResponse: (statusCode, body, contentType='application/json') => {
        const response = {
            statusCode,
            headers: {
                'Access-Control-Allow-Origin': "*",
                'Access-Control-Allow-Credentials': true,
                'Content-Type': contentType
            },
            body: body
        }
        if (contentType === 'application/json') {
            response.body = JSON.stringify(response.body)
        }
        console.log('Sending response with ', JSON.stringify(response))
        return response
    },

    createApiKey: async (tenantHash) => {
        console.log(`Creating API Key for Tenant: ${tenantHash}`)
        try {
            const params = {
                description: `Default API Key for Tenant ${tenantHash}`,
                enabled: true,
                generateDistinctId: true,
                name: `${tenantHash}`
            };
            const apikeyCommand = new CreateApiKeyCommand(params);
            const apiKey = await client.send(apikeyCommand);
            return apiKey
        } catch (error) {
            console.error('Failed to create API key:', error)
            throw error
        }
    },

    deleteApiKey: async (apikeyId) => {
        console.log(`Deleting API Key ID: ${apikeyId}`)
        try {
            const params = {
                apiKey: apikeyId
            }
            const apikeyCommand = new DeleteApiKeyCommand(params);
            const response = await client.send(apikeyCommand);
            return response
        } catch (error) {
            console.error('Failed to create API key:', error)
            throw error
        }
    },

    // usagePlanId must be passed, the default points to staging (QA)
    addApiKeyToUsagePlan: async (apiKeyId, usagePlanId="t61fwq") => {
        console.log(`Associating API Key ${apiKeyId} to Usage plan ${usagePlanId}`)
        try {
            // We may support different usage plans in the future
            const params = {
                keyId: apiKeyId,
                keyType: "API_KEY",
                usagePlanId: usagePlanId
            };
            const apikeyCommand = new CreateUsagePlanKeyCommand(params);
            const response = await client.send(apikeyCommand);
            return response
        } catch (error) {
            console.error('Failed to associate API key to usage plan:', error)
            throw error
        }
    },

    // usagePlanId must be passed, the default points to staging (QA)
    removeApiKeyFromUsagePlan: async (apiKeyId, usagePlanId="t61fwq") => {
        console.log(`Removing API Key ${apiKeyId} from Usage plan ${usagePlanId}`)
        try {
            const params = {
                keyId: apiKeyId,
                usagePlanId: usagePlanId
            };
            const apikeyCommand = new DeleteUsagePlanKeyCommand(params);
            const response = await client.send(apikeyCommand);
            return response
        } catch (error) {
            console.error('Failed to remove API key from usage plan:', error)
            throw error
        }
    },

    getApiUsagePlans: async () => {
        try {
            const params = {};
            const command = new GetUsagePlansCommand(params);
            const response = await client.send(command);
            return response
        } catch (error) {
            console.error('Failed to get usage plan:', error)
            throw error
        }
    }

}