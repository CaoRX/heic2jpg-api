import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const createApiGateway = () => {
  const heic2jpgApi = new aws.apigatewayv2.Api("heic2jpgApi", {
    protocolType: "HTTP",
    name: "heic2jpg-api",
  });

  return heic2jpgApi;
}

export const setupApiLambdaIntegration = (api: aws.apigatewayv2.Api, lambdaFunction: aws.lambda.Function) => {
  const heic2jpgIntegration = new aws.apigatewayv2.Integration("heic2jpgIntegration", {
    apiId: api.id,
    integrationType: "AWS_PROXY",
    integrationUri: lambdaFunction.invokeArn,
    integrationMethod: "POST",
    payloadFormatVersion: "2.0",
  });

  const route = new aws.apigatewayv2.Route("heic2jpgRoute", {
    apiId: api.id,
    routeKey: "POST /heic2jpg",
    target: pulumi.interpolate `integrations/${heic2jpgIntegration.id}`,
  });

  const stage = new aws.apigatewayv2.Stage("heic2jpgStage", {
    apiId: api.id,
    name: "prod",
    autoDeploy: true,
  });

  const apigwLambdaPermission = new aws.lambda.Permission("apigwLambdaPermission", {
    statementId: "AllowAPIGatewayInvoke",
    action: "lambda:InvokeFunction",
    function: lambdaFunction.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate `${api.executionArn}/*/*`,
  });

  return {
    endpoint: pulumi.interpolate `${stage.invokeUrl}/heic2jpg`,
    integration: heic2jpgIntegration,
    route, stage,
    permission: apigwLambdaPermission,
  }
}