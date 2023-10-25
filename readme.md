
# Quickly Appsync Be

Steps and guide to setup backend

Stack depends on parent cloudformation stack available at **./cloudformation/quickly-vpc-rds-proxy.yml** in the same directory. Deployment steps are available at **./cloudformation/readme.md**
Deployment uses values from the config file. Below is the sample structure of the config file.
```
{
    "STAGE_NAME": {
      "region": "Region where to deploy",
      "memorySize": "Lambda function memory size",
      "externalId": "UUID for SMS settings Cognito",
      "fromEmail": "Email address to send email updates",
      "OAuthRedirect": "Redirect URL for cognito hosted UI",
      "OAuthDomain": "quickly-appsync-be",
      "lumigoLayerARN": "Lumigo layer ARN",
      "isPipeline": true,
      "repositoryName":"Code Repository Name",
      "branchName":"Repository Branch"
   }
}
```
Same information is available at **sample.config.json** at the root of the project. Need to create **config.json**, with above structure at the root of the project.
The value for the **externalId** can be derived from here https://www.uuidgenerator.net/

System uses AWS Pinpoint for emails and push notification setup. So while choosing a region please consider the below image.
![Available Pinpoint Regions](https://quickly-appsync-be-setup-guide.s3.us-east-2.amazonaws.com/pinpoint-available-regions.png)

After completing the **config.json** file, next step will be to install project dependencies before deployment.

System relies on dev dependencies for local execution-testing and uses lambda layers for cloud dependencies.
Lambda layer dependencies can be installed by doing **npm i** inside **/layers/static-layer/nodejs/**

Note: Based on `repositoryName` and `branchName` pipeline automatically updated the stack so make sure both values are valid.

Now stack can be deployed with below command
```
sls deploy --stage <STAGE_NAME>
```
Make sure you use **serverless cli v2**.
To install serverless cli use **npm i serverless@2 -g**

## Repository Branching structure
 
![Git Branch structure](/extra/gitbranch.png)
 
As we have Automated pipeline so when developer push changes to the repository pipeline automatically runs and deploy new changes to specific stack.
 
For that we need proper branching structure so all pipeline pint to specific branch because if multiple pipeline points to same branch when developer push change to that branch it will triggers multiple pipelines same time and update all environment stack so we created following branches for specific environment stack.
 
- master : push all day to day changes.
- dev : for development environment.
- qa : for qa environment.
- production : for production environment.
- aglocal : for appgambit local environment.
 
## Pipeline Details
![CodePipeline](/extra/pipeline.png)

CodePipeline hase 2 stage
- Source: pull source code from repository
- Build: Perform build operation based on `buildspec.yml` file.

## Post Stage Deployment

If this is the first time a new stage is deployed in the target AWS account, then please go to the AWS Console and create a new Cognito User and add that user into the Super Admin Group. As of now, the Super Admin user is not being created automatically on the new stage deployment.

## GraphQL Docs Generation

Install the GraphDoc NPM

```
npm install -g @2fd/graphdoc
```

Generate the docs from AppSync Endpoint. Remember Quickly endpoint is authenticated so you will need to copy the Access token of any user and then fire the following command.

```
graphdoc -e <AppSync Endpoint> -o <docs output directory> -x 'authorization: <access token>'
graphdoc -e https://graphql.delego.ai/graphql -o docs-graphql/ -x 'authorization:<access token>'

or using an api key

graphdoc -e <AppSync Endpoint> -o <docs output directory> -x 'x-api-key: <api key>'
graphdoc -e https://graphql.delego.ai/graphql -o docs-graphql/ -x "x-api-key: da2**********"
```

Now sync the directory with the S3 bucket.

```
aws s3 sync <docs output directory> <s3 uri>
aws s3 sync docs-graphql s3://quickly-appsync-api-docs
```


## Run DB Migrations

We use Sequelize to apply changes to the database. For more information see https://sequelize.org/docs/v6/other-topics/migrations/

To run migration scripts, first you have to create the `config-sequelize.json` configuration file and set the correct DB access variables.

```
{
    "staging": {
        "username": "quickly",
        "password": "<Db password>",
        "database": "postgres",
        "schema": "test",
        "host": "127.0.0.1",
        "dialect": "postgres",
        "port": "5432"
    },
    "agdev": {
        "username": "quickly",
        "password": "<Db password>",
        "database": "postgres",
        "schema": "public",
        "host": "127.0.0.1",
        "dialect": "postgres",
        "port": "5432"
    }
}
```

You also need to define the configuration values to use by setting the NODE_ENV environment variable.
For instance if you want to use the stating configuration in your config-sequelize.json file, then run:
```
export NODE_ENV=staging
```

Prior to running sequelize-cli it is important to create an ssh tunnel from the host machine where sequelize-cli is going to run to the DB host.
For example, on Linux:
```
ssh -L 5432:qaf2q0zywvuxgt.cnh2arqmiwe4.us-east-1.rds.amazonaws.com:5432 -i ~/Documents/personal/identities/bastion_host.pem ec2-user@18.208.99.198

# PRODUCTION SSH TUNNEL
ssh -L 5432:quickly-prod-vpc-rds-auroradbfirstinstance-k0kjguy1fiig.ca7eeppwbbcj.us-east-1.rds.amazonaws.com:5432 -i ~/Downloads/bastion_host_prod.pem ec2-user@3.238.44.128
```

To run all the pending/new migrations since the last time migrations are ran. This is standard practice if there are multiple environments and each is updated at periodic intervals.

```
# if install globally (e.g. npm install -g sequelize-cli)
sequelize db:migrate
# else if not install globally
npx sequelize-cli db:migrate
```

This is not preferred but still helpful to run a single migration script. Please use this carefully. For all practical purposes, use the common migration command explained above.

```
# if install globally (e.g. npm install -g sequelize-cli)
sequelize migration:generate --name <name-of-migration>
# else if not install globally
npx sequelize-cli migration:generate --name <name-of-migration>
```

If required to mark one migration as completed, the migration file name can be inserted into the SequelizeMeta table, for example to mark one migration as done in test schema (qa):
```
insert into test."SequelizeMeta"("name")
VALUES ('20220901071945-tenant-new-column.js')
```

The migration files will be generated in the db-migrations folder as mentioned in the .sequelizerc file. We have provided a custom migration path which points to the db-migrations folder.

## Using Lumigo

We have removed the serverless-lumigo plugin and instead we have defined a static lumigo arn in the config.json. The arn is updated to the most recent version (209). We have to keep updating the lumigo arn periodically to keep the lumigo tracing feature active for all the lambda functons.


## Output JSON

Whenever you deploy a stack, the outputs needed for the setup will be saved into the outputs.json file.