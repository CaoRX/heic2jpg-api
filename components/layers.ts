import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export type Layers = {
  sharpLayer: aws.lambda.LayerVersion,
  awsSDKLayer: aws.lambda.LayerVersion,
}

export const createLayers = () => {
  const sharpLayer = new aws.lambda.LayerVersion("sharpLayer", {
    code: new pulumi.asset.FileArchive("layers/sharp-layer.zip"),
    layerName: "sharp-layer-pulumi",
    compatibleRuntimes: ["nodejs20.x"],
    compatibleArchitectures: ["arm64"],
    description: "A layer that includes sharp with heic support",
  });

  const awsSDKLayer = new aws.lambda.LayerVersion("awsSDKLayer", {
    code: new pulumi.asset.FileArchive("layers/aws-sdk-layer.zip"),
    layerName: "aws-sdk-layer-pulumi",
    compatibleRuntimes: ["nodejs20.x"],
    compatibleArchitectures: ["arm64"],
    description: "A layer that includes the AWS SDK",
  });

  return {
    sharpLayer,
    awsSDKLayer,
  }
}