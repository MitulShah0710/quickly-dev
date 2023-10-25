const CognitoIdentityServiceProvider = require('aws-sdk/clients/cognitoidentityserviceprovider')
const CIDP = new CognitoIdentityServiceProvider()
const { env: { USERPOOL_ID,  } } = process

module.exports.handler = async (event) => {
    console.log('Incoming event', JSON.stringify(event))
    const { userAttributes, deliveryMedium } = event
    const { email=false, phone=false, tenantHash=false } = userAttributes
    
    //either email or phone required
    if(!email && !phone) {
        console.log('No email or phone attribute provided!')
        throw new Error('Email or phone attribute required!')
    }

    //tenant hash is required
    if(!tenantHash) {
        console.log('tenant hash not provided!')
        throw new Error('Tenant hash missing!')
    }

    console.log('Valid request, performing user create operation!')
    const param = {}
    param.UserPoolId = USERPOOL_ID
    
    //if email then username and delivery medium both will be email 
    if(email && !phone) {
        console.log('Creating user with email as username attribute')
    } else if(!email && phone){
        console.log('Creating user with phone as username attribute')
    }
}

this.handler({
    userAttributes: {
        email: '',
        firstName: '',
        lastName: '',
        tenantHash: ''
    },
    deliveryMedium: 'email || phone',
})


//create new user
//add user to group

/*
var params = {
  UserPoolId: 'STRING_VALUE', 
  Username: 'STRING_VALUE', 
  ClientMetadata: {
    '<StringType>': 'STRING_VALUE',
     '<StringType>': ... 
  },
  DesiredDeliveryMediums: [
    SMS | EMAIL,
    
  ],
  ForceAliasCreation: true || false,
  MessageAction: RESEND | SUPPRESS,
  TemporaryPassword: 'STRING_VALUE',
  UserAttributes: [
    {
      Name: 'STRING_VALUE', 
      Value: 'STRING_VALUE'
    },
    
  ],
  ValidationData: [
    {
      Name: 'STRING_VALUE', 
      Value: 'STRING_VALUE'
    },
    
  ]
};
cognitoidentityserviceprovider.adminCreateUser(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});

*/