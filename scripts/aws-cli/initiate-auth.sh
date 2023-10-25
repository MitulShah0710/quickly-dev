USERPOOL_ID=us-east-1_pCspKy1r8
CLIENT_ID=6hg9kqbdihnk4sl5cf9anq35ou
NAME=Test
EMAIL=abhishek.desai+quick-admin@appgambit.com
PASSWORD=Test@1234
REGION=us-east-1
PROFILE=sm2

aws cognito-idp admin-initiate-auth --user-pool-id "$USERPOOL_ID" --client-id "$CLIENT_ID" --auth-flow ADMIN_USER_PASSWORD_AUTH --auth-parameters USERNAME="$EMAIL",PASSWORD="$PASSWORD" --region "$REGION"