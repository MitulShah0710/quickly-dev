USERPOOL_ID=us-east-1_dtn34fRkj
GIVEN_NAME=Abhishek
FAMILY_NAME=Desai
EMAIL=abhishek.desai+quickly-super-admin45@appgambit.com
PASSWORD=Test@1234
REGION=us-east-1
PROFILE=sm2

aws cognito-idp admin-create-user --user-pool-id "$USERPOOL_ID" --username "$EMAIL" --user-attributes Name=email,Value="$EMAIL" Name=given_name,Value="$GIVEN_NAME" Name=family_name,Value="$FAMILY_NAME" --message-action SUPPRESS --region "$REGION" && aws cognito-idp admin-set-user-password --user-pool-id "$USERPOOL_ID" --username "$EMAIL" --password "$PASSWORD" --permanent --region "$REGION" && aws cognito-idp admin-add-user-to-group --user-pool-id "$USERPOOL_ID" --username "$EMAIL" --group-name SuperAdmin