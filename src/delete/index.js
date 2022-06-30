const AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient();
var s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log(JSON.stringify(event));
  const body = JSON.parse(event.body);

  let result = {};

  // delete item from dynamoDb table
  // Using documentClient to update DynamoDB item
  // @see https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-document-client.html#dynamodb-example-document-client-update
  await docClient
    .delete({
      TableName: process.env.TABLE_NAME,
      Key: {
        id: body.id,
      },
    })
    .promise();

  // delete item from s3 bucket
  await s3
    .deleteObject({
      Bucket: process.env.BUCKET,
      Key: body.key,
    })
    .promise();

  result = { success: true };

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE",
    },
    body: JSON.stringify(result),
  };
};
