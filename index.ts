import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { setupLambda } from "./components/lambda";
import { createApiGateway, setupApiLambdaIntegration } from "./components/api";
import { setupTokenGenerator } from "./components/token_generator";
import { createTokenTable } from "./components/token_table";
import { createLayers } from "./components/layers";

const layers = createLayers();

// create a dynamodb table to store the API tokens and remaining credits
const apiTokenTable = createTokenTable();

const handlerLambda = setupLambda(layers, apiTokenTable);
const tokenGenerator = setupTokenGenerator(layers, apiTokenTable);

const api = createApiGateway();
const integration = setupApiLambdaIntegration(api, handlerLambda.handler);
const endpoint = integration.endpoint;

export { endpoint };
export const apiTokenTableArn = apiTokenTable.arn;
export const tokenGeneratorFunctionArn = tokenGenerator.handler.arn;