import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const createTokenTable = () => {
  const apiTokenTable = new aws.dynamodb.Table("apiTokensTable", {
    billingMode: "PROVISIONED",
    readCapacity: 5,
    writeCapacity: 5,
    hashKey: "token",
    attributes: [
      { name: "token", type: "S" },
    ],
  });

  return apiTokenTable;
}