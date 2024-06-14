import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Step 0. Create a layer
const sharpLayer = new aws.lambda.LayerVersion("sharpLayer", {
  code: new pulumi.asset.FileArchive("heic2jpg-layer/sharp-layer.zip"),
  layerName: "sharp-layer-pulumi",
  compatibleRuntimes: ["nodejs20.x"],
  compatibleArchitectures: ["arm64"],
  description: "A layer that includes sharp with heic support",
});

// Step 1. create a lambda function
const apiHandlerRole = new aws.iam.Role("apiHandlerRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
        Effect: "Allow",
        Sid: "",
      },
    ],
  }),
});

const cloudwatchLogsRoleAttachment = new aws.iam.RolePolicyAttachment("cloudwatchLogsRoleAttachment", {
  policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
  role: apiHandlerRole.name,
});

const lambdaLogGroup = new aws.cloudwatch.LogGroup("lambdaLogGroup", {
  name: "/aws/lambda/heic2jpg-log-group",
});

const lambdaFunction = new aws.lambda.Function("heic2jpg", {
  role: apiHandlerRole.arn,
  runtime: "nodejs20.x",
  architectures: ["arm64"],
  handler: "lambda_function.handler",
  code: new pulumi.asset.FileArchive("./heic2jpg"),
  timeout: 15,
  memorySize: 1024,
  layers: [sharpLayer.arn],
  loggingConfig: {
    logFormat: "Text",
    logGroup: lambdaLogGroup.id,
  },
  environment: {
    variables: {
      LIBHEIF_PLUGIN_PATH: "/opt/lib/libheif",
    }
  }
}, {
  dependsOn: [sharpLayer, cloudwatchLogsRoleAttachment],
});

// // Step 2. create a REST API Gateway to trigger the lambda function
const heic2jpgApi = new aws.apigatewayv2.Api("heic2jpgApi", {
  protocolType: "HTTP",
  name: "heic2jpg-api",
});

const heic2jpgIntegration = new aws.apigatewayv2.Integration("heic2jpgIntegration", {
  apiId: heic2jpgApi.id,
  integrationType: "AWS_PROXY",
  integrationUri: lambdaFunction.invokeArn,
  integrationMethod: "POST",
  payloadFormatVersion: "2.0",
});

const route = new aws.apigatewayv2.Route("heic2jpgRoute", {
  apiId: heic2jpgApi.id,
  routeKey: "POST /heic2jpg",
  target: pulumi.interpolate `integrations/${heic2jpgIntegration.id}`,
});

const stage = new aws.apigatewayv2.Stage("heic2jpgStage", {
  apiId: heic2jpgApi.id,
  name: "prod",
  autoDeploy: true,
});

const apigwLambdaPermission = new aws.lambda.Permission("apigwLambdaPermission", {
  statementId: "AllowAPIGatewayInvoke",
  action: "lambda:InvokeFunction",
  function: lambdaFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate `${heic2jpgApi.executionArn}/*/*`,
});

export const endpoint = pulumi.interpolate `${stage.invokeUrl}/heic2jpg`;