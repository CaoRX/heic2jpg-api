import crypto from 'crypto';
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const handler = async (event) => {
  // generate a random token, and insert to my dynamoDB table
  // return the token to the user
  // token: a random string of 32 characters
  const token = crypto.randomBytes(32).toString('hex');

  // save to my dynamoDB table
  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      "token": token,
      "credits": 10,
    }
  }

  try {
    await dynamodb.put(params).promise();
  } catch (error) {
    console.log("Unable to save token to DynamoDB: ", JSON.stringify(error));
    return {
      statusCode: 500,
      body: "Unable to save token to DynamoDB",
    };
  }

  const response = {
    statusCode: 200,
    body: "Your token is: " + token,
  };

  return response;
}