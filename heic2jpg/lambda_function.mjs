import sharp from "sharp";
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const checkToken = async (token) => {
  if (!token) {
    return {
      success: false,
      statusCode: 400,
      body: "Missing token",
    };
  }

  const getParams = {
    TableName: process.env.TABLE_NAME,
    Key: {
      "token": token,
    },
    ConsistentRead: true,
  };

  try {
    const tokenData = await dynamodb.get(getParams).promise();
    if (!tokenData.Item) {
      return {
        success: false,
        statusCode: 400,
        body: "Token not found",
      };
    }

    const credits = tokenData.Item.credits;
    if (credits <= 0) {
      return {
        success: false,
        statusCode: 400,
        body: "API token has no remaining credits",
      };
    }

    const updateParams = {
      TableName: process.env.TABLE_NAME,
      Key: {
        "token": token,
      },
      UpdateExpression: "SET credits = credits - :val",
      ConditionExpression: "credits > :zero",
      ExpressionAttributeValues: {
        ":val": 1,
        ":zero": 0,
      },
      ReturnValues: "UPDATED_NEW",
    };

    const updatedItem = await dynamodb.update(updateParams).promise();
  } catch (error) {
    console.error("Unable to get token from DynamoDB: ", JSON.stringify(error));
    if (error.code === "ConditionalCheckFailedException") {
      return {
        success: false,
        statusCode: 400,
        body: "API token has no remaining credits",
      };
    } else {
      return {
        success: false,
        statusCode: 500,
        body: "Unable to get token from DynamoDB",
      };
    }
  }

  return {
    success: true,
  }
}
export const handler = async (event) => {
  // a valid request should contain an API token
  // search in my dynamoDB table for the token
  // to see if it is valid and has remaining credits
  // if not, return a 401 error
  // if yes, process the image and return the result

  const body = JSON.parse(event.body);
  const token = body.token;

  const tokenCheck = await checkToken(token);
  if (!tokenCheck.success) {
    return {
      statusCode: tokenCheck.statusCode,
      body: tokenCheck.body,
    };
  }

  const base64Image = body.image;
  const imageBuffer = Buffer.from(base64Image, 'base64');

  const outputBuffer = await sharp(imageBuffer).jpeg().toBuffer();
  const base64Output = outputBuffer.toString('base64');

  const response = {
    statusCode: 200,
    Headers: {
      "Content-Type": "image/jpeg",
    },
    body: base64Output,
  };

  console.log("Sending response...");
  return response;
}