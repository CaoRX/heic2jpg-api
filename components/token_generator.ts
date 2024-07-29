import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { type Layers } from "./layers";

export const setupTokenGenerator = (layers: Layers, tokenTable: aws.dynamodb.Table) => {
  // create a lambda function that generates a token
  // and stores it in the dynamodb table, with a credit

  const tokenGeneratorRole = new aws.iam.Role("tokenGeneratorRole", {
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
        }
      ]
    }),
  });

  const cloudwatchLogsRoleAttachment = new aws.iam.RolePolicyAttachment("tokenGeneratorCloudwatchLogsRoleAttachment", {
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    role: tokenGeneratorRole.name,
  });

  const lambdaLogGroup = new aws.cloudwatch.LogGroup("tokenGeneratorLogGroup", {
    name: "/aws/lambda/token-generator-log-group",
  });

  // add access to the dynamodb table
  const tokenGeneratePolicy = new aws.iam.RolePolicy("tokenGeneratorTokenTableAccessPolicy", {
    role: tokenGeneratorRole,
    policy: tokenTable.arn.apply(arn => JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Action: [
          "dynamodb:PutItem",
        ],
        Effect: "Allow",
        Resource: arn,
      }]
    })),
  });

  const tokenGeneratorFunction = new aws.lambda.Function("tokenGenerator", {
    role: tokenGeneratorRole.arn,
    runtime: "nodejs20.x",
    architectures: ["arm64"],
    handler: "lambda_function.handler",
    code: new pulumi.asset.FileArchive("./token_generator"),
    timeout: 3,
    memorySize: 128,
    layers: [layers.awsSDKLayer.arn],
    loggingConfig: {
      logFormat: "Text",
      logGroup: lambdaLogGroup.id,
    },
    environment: {
      variables: {
        TABLE_NAME: tokenTable.name,
      }
    },
  }, {
    dependsOn: [layers.awsSDKLayer, cloudwatchLogsRoleAttachment, tokenGeneratePolicy],
  });

  return {
    handler: tokenGeneratorFunction,
    handlerRole: tokenGeneratorRole,
    logGroup: lambdaLogGroup,
  }
}