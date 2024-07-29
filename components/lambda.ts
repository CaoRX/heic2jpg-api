import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { type Layers } from "./layers";

export const setupLambda = (layers: Layers, tokenTable: aws.dynamodb.Table) => {
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

  // add access to the dynamodb table
  const tableAccessPolicy = new aws.iam.RolePolicy("handlerTokenTableAccessPolicy", {
    role: apiHandlerRole,
    policy: tokenTable.arn.apply(arn => JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Action: [
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
        ],
        Effect: "Allow",
        Resource: arn,
      }]
    })),
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
    layers: [layers.sharpLayer.arn, layers.awsSDKLayer.arn],
    loggingConfig: {
      logFormat: "Text",
      logGroup: lambdaLogGroup.id,
    },
    environment: {
      variables: {
        LIBHEIF_PLUGIN_PATH: "/opt/lib/libheif",
        TABLE_NAME: tokenTable.name,
      }
    }
  }, {
    dependsOn: [layers.sharpLayer, layers.awsSDKLayer, cloudwatchLogsRoleAttachment],
  });

  return {
    handler: lambdaFunction,
    handlerRole: apiHandlerRole,
    logGroup: lambdaLogGroup,
  }
}