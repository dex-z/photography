const ENDPOINT = "http://dyobx3wr7zyb3.cloudfront.net";

const AWS = require("aws-sdk");
const SNS = new AWS.SNS();

const checkWebsite = async (url) => {
  // TODO : this code would make a request to website URL and check status code
  // return true if status code is 200 OK - otherwise return false

  // for this example, we simply return random true or false
  return Math.round(Math.random()) ? true : false;
};

/**
 * @description: Lambda main handler
 */
exports.handler = async (event) => {
  // check if website is up/down
  const isWebsiteUp = await checkWebsite(ENDPOINT);

  // publish to SNS
  if (!isWebsiteUp) {
    console.log("sending alert");
    const params = {
      TopicArn: process.env.SNS_TOPIC,
      Message: "Alert: website is down",
    };
    await SNS.publish(params).promise();
  }

  return isWebsiteUp;
};