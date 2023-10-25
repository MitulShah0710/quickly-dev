module.exports = (resource, logicalId) => {
  // console.log(resource.Type, logicalId);
  if (
    logicalId.startsWith("ServerlessDeploymentBucket") ||
    resource.Type == "AWS::Lambda::Permission"
  ) {
    return;
  }

  // RegEx alone will not work as the list is custom selected for minimal to no dependencies across stacks.
  const arr = [
      //Task related roles
      "ApiCreateTasksIamRoleLambdaExecution",
      "GraphQlDsLambdaacceptTaskInviteRole",
      "CheckTaskStatusFunctionIamRoleLambdaExecution",
      "GraphQlDsLambdaassignAgentToTaskRole",
      "GraphQlDsLambdaassignTeamToTaskRole",
      "GraphQlDsLambdacancelTaskRole",
      "GraphQlDsLambdacreateTaskRole",
      "GraphQlDsLambdacreateTaskStatusMessageRole",
      "GraphQlDsLambdacreateTaskTypeRole",
      "GraphQlDsLambdadeleteTaskStatusMessageRole",
      "GraphQlDsLambdadeleteTaskTypeRole",
      "GraphQlDsLambdacreateTaskInviteFuncRole",
      "GraphQlDsLambdacreateTaskTenantInviteRole",
      "GraphQlDsLambdagetTaskHistoryRole",
      "GraphQlDsLambdagetTaskStatusMessageRole",
      "GraphQlDsLambdagetTaskStatusRole",
      "GraphQlDsLambdagetTaskTypeRole",
      "GraphQlDsLambdagetTasksByTeamRole",
      "GraphQlDsLambdagetTasksRole",
      "GraphQlDsLambdaupdateTaskRole",
      "GraphQlDsLambdaupdateTaskStatusMessageRole",
      "GraphQlDsLambdaupdateTaskTypeRole",

      //Tenant, WebUser, Segment related roles
      "CountTenantAccountsIamRoleLambdaExecution",
      "CreateTenantAccountIamRoleLambdaExecution",
      "CreateWebUserIamRoleLambdaExecution",
      "CreateSegmentIamRoleLambdaExecution",
      "GraphQlDsLambdagetWebUsersRole",
      "GraphQlDsLambdagetTenantInfoRole",

      //Agent related roles
      "GraphQlDsLambdacreateAgentRole",
      "GetAgentsFunctionIamRoleStacksLambdaExecution",
      "NotifyAgentsFunctionIamRoleLambdaExecution",
      "PushNotificationsAgentIamRoleLambdaExecution",
      "GraphQlDsLambdagetAgentActiveTasksRole",
      "GraphQlDsLambdagetAgentsByTeamAndStatusRole",
      "GraphQlDsLambdagetAgentsRole",
      "GraphQlDsLambdagetAgentsTasksRole",
      "GraphQlDsLambdagetInvitesByAgentRole",
      "GraphQlDsLambdagetSelfAgentProfileRole",
      "GraphQlDsLambdaupdateAgentCognitoRole",

      //Hub related roles
      "GraphQlDsLambdacreateHubRole",
      "GraphQlDsLambdadeleteHubRole",
      "GraphQlDsLambdagetHubRole",
      "GraphQlDsLambdagetHubsRole",
      "GraphQlDsLambdaupdateHubRole",

      //Location related roles
      "GraphQlDsLambdacreateLocationRole",
      "GraphQlDsLambdadeleteLocationRole",
      "GraphQlDsLambdagetLocationRole",
      "GraphQlDsLambdagetLocationsRole",
      "CustomUpdateEndpointIamRoleLambdaExecution",
      "PushLocationUpdatesIamRoleLambdaExecution",
      "GraphQlDsLambdaupdateLocationRole",

      //Team related roles
      "GraphQlDsLambdacreateTeamRole",
      "GraphQlDsLambdadeleteTeamRole",
      "GraphQlDsLambdagetTeamRole",
      "GraphQlDsLambdagetTeamsRole",
      "GraphQlDsLambdaupdateTeamRole",
      "GraphQlDsLambdaupdateTenantInfoRole",

      //other random roles
      "CatalogStreamHandlerIamRoleLambdaExecution",
      "CustomAuditLogsIamRoleLambdaExecution",
      "GetCustomFilterIamRoleLambdaExecution",
      "GraphQlDsLambdagetCustomDataRole",
      "GraphQlDsLambdagetCustomFilterExecutedQueryFuncRole",
      "VerifyEmailHandlerIamRoleLambdaExecution",

      //Policies
      "WaSendSnsToSqsPolicy",
      "WaReceiveSnsToSqsPolicy",
      "EmailSendSnsToSqsPolicy"
  ];
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (logicalId.includes(element) || logicalId.endsWith(element)) {
      return { destination: "IAMRole", allowSuffix: true, force: true };
    }
  }

  if (logicalId == "AmazonCloudWatchEventRole" ) {
    return { destination: "DeploymentStack", allowSuffix: true, force: true };
  }

  switch (resource.Type) {
    case "AWS::Logs::LogGroup":
      if (!logicalId.endsWith("GraphQlApiLogGroup")) {
        return { destination: "LogGroups", allowSuffix: true, force: true };
      }
    break;

    case "AWS::S3::Bucket":
    case "AWS::S3::BucketPolicy":
      return { destination: "S3Group", allowSuffix: true, force: true };

    case 'AWS::Lambda::LayerVersion':
      return { destination: 'Layers', allowSuffix: true, force: true };

    case "AWS::ApiGateway::ApiKey":
    case "AWS::ApiGateway::UsagePlan":
    case "AWS::ApiGateway::UsagePlanKey":
    case "AWS::ApiGateway::RequestValidator":
    case "AWS::ApiGateway::Model":
    case "AWS::ApiGateway::Deployment":
    case "AWS::ApiGateway::Stage":
    case "AWS::ApiGateway::Method":
    case "AWS::ApiGateway::Resource":
      return { destination: "ApiGateway", allowSuffix: true, force: true };

    case "AWS::AppSync::FunctionConfiguration":
    case "AWS::AppSync::DataSource":
    case "AWS::AppSync::Resolver":
      return { destination: "AppSync", allowSuffix: true, force: true };

    case "AWS::AppSync::ApiKey":
    case "AWS::AppSync::GraphQLApi":
    case "AWS::AppSync::GraphQLSchema":
      return { destination: "AppSyncApiKey", allowSuffix: true, force: true };

    case "AWS::CodeBuild::Project":
    case "AWS::CodePipeline::Pipeline":
    case "AWS::Events::Rule":
      return { destination: "DeploymentStack", allowSuffix: true, force: true };

    default:
      if (resource.Type.startsWith("AWS::ApiGatewayV2::")) {
        return { destination: "ApiGateway", allowSuffix: true, force: true };
      }
    // Falls back to default
  }
};
