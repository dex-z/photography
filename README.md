# Welcome to your CDK TypeScript project - PhotographyStack

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

You are a photographer and want to keep your photos in a place that you can view when you're away from your computer.

we provision an environment via CDK that includes a CloudFront Distrubution backed by an S3 Object Store. We
use these resources to serve our static assets, including our index.html and images. To make it easier to identify the
resources we created via our CloudFormation stack we added [CfnOutput](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.CfnOutput.html).

[CDK CloudFront API Docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html)
to see if there were ways we could server the index.html without specifying it in the URL.

## CRUD APIS 

A website that you manually have to update each time to add a new image isn't fun. In starting out CRUD APIs we
simplified how we upload images and have images displayed out our website.

Time permitting, we were able to add monitoring to help us gain visibility on the availability of our website.


## CDN validation:

```
aws cloudformation describe-stack-resources --stack-name PhotographyStack --query "StackResources[?starts_with(LogicalResourceId,'photographydistribution') && ResourceType=='AWS::CloudFront::Distribution'].PhysicalResourceId" --output text
```

```
aws cloudfront create-invalidation --distribution-id ****** --paths "/*"
```

## upload files to s3

```
aws s3 cp src/web/js/app.js s3://BUCKET/js/app.js

aws s3 cp src/web/index.html s3://BUCKET

aws s3 cp src/web/styles/main.css s3://BUCKET/styles/main.css
```
