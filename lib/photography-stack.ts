import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as chatbot from 'aws-cdk-lib/aws-chatbot';

export class PhotographyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here 

    // example resource 
    const appBucket = new s3.Bucket(this, "photography-app-bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // S3 bucket for photos 
    const photoBucket = new s3.Bucket(this, "photography-photo-bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    const appDistribution = new cloudfront.Distribution(this, 'photography-distribution', {
      defaultBehavior: { origin: new origins.S3Origin(appBucket) },
      defaultRootObject: "index.html",
      additionalBehaviors: {
        '/photos/*': {
          origin: new origins.S3Origin(photoBucket)
        }
      }
    });


    const createFunction = new lambda.Function(this, "photography-upload-function", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("src/create"),
      handler: "index.handler",
      environment: {
        "BUCKET": photoBucket.bucketName
      }
    })

    photoBucket.grantWrite(createFunction)

    const photoApi = new apigateway.RestApi(this, "photography-photo-api", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS
      }
    })

    const uploadResource = photoApi.root.addResource("photo");
    uploadResource.addMethod("POST", new apigateway.LambdaIntegration(createFunction))


    // DDB table store image data 
    const photoTable = new dynamodb.Table(this, "photography-table", {
      partitionKey: {
        name: "id", type: dynamodb.AttributeType.STRING
      }
    })

    const registerFunction = new lambda.Function(this, "photography-function-register", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('src/register'),
      handler: 'index.handler',
      environment: {
        "TABLE_NAME": photoTable.tableName
      }
    })

    registerFunction.addEventSource(new S3EventSource(photoBucket, {
      events: [
        s3.EventType.OBJECT_CREATED
      ]
    }))

    photoBucket.grantRead(registerFunction)
    photoTable.grantWriteData(registerFunction)

    // List Images Lambda 
    const listFunction = new lambda.Function(this, "photography-function-list", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('src/list'),
      handler: 'index.handler',
      environment: {
        "TABLE_NAME": photoTable.tableName
      }
    })

    photoTable.grantReadData(listFunction)

    uploadResource.addMethod("GET", new apigateway.LambdaIntegration(listFunction))

    // delete Images Lambda 
    const deleteFunction = new lambda.Function(this, "photography-function-delete", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('src/delete'),
      handler: 'index.handler',
      environment: {
        "TABLE_NAME": photoTable.tableName,
        "BUCKET": photoBucket.bucketName
      }
    })
    // add delete function permissions to delete photo and ddb register 
    photoBucket.grantReadWrite(deleteFunction)
    photoBucket.grantDelete(deleteFunction)
    photoTable.grantWriteData(deleteFunction)

    uploadResource.addMethod("DELETE", new apigateway.LambdaIntegration(deleteFunction))
    uploadResource.addMethod("PUT", new apigateway.LambdaIntegration(deleteFunction))

    // SNS Topic 
    const monitorTopic = new sns.Topic(this, "WebsiteIsDownTopic", {
      topicName: "WebsiteIsDown",
      displayName: "Website is Down"
    })
    const apiTopic = new sns.Topic(this, "apiwCount", {
      topicName: "apiCount",
      displayName: "apigateway trigger count"
    })
    // monitorTopic.addSubscription(new subscriptions.EmailSubscription(emailAddress.valueAsString));
    // Lambda function 
    const monitorWebsiteFunction = new lambda.Function(this, "MonitorWebsite", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("src/monitor"),
      handler: "index.handler",
      environment: {
        "SNS_TOPIC": monitorTopic.topicArn
      }
    })

    // create Cloudwatch rule 
    new events.Rule(this, 'MonitorWebsiteRule', {
      description: "CloudWatch event to trigger Lambda every one minute",
      schedule: events.Schedule.rate(Duration.minutes(1)),
      targets: [
        // add CloudWatch target 
        new targets.LambdaFunction(monitorWebsiteFunction, {
          event: events.RuleTargetInput.fromObject({})
        })
      ]
    });

    // Chatbot configuration
    // declare const project: codebuild.Project;

    // This can be re-enabled after Chatbot workspace authentication is fixed
    // const target = new chatbot.SlackChannelConfiguration(this, 'CDK-Chatbot-Slack', {
    //   slackChannelConfigurationName: 'devops',
    //   slackWorkspaceId: 'T01EXEXPMN0',
    //   slackChannelId: 'C01EAHTMG7R',
    //   loggingLevel: chatbot.LoggingLevel.ERROR,

    // });

    // const rule = project.notifyOnBuildSucceeded('NotifyOnBuildSucceeded', target);

    new CfnOutput(this, "AppBucket", { value: appBucket.bucketName })
    new CfnOutput(this, "CfDistDomainName", { value: appDistribution.domainName })
    new CfnOutput(this, "CfDistDomainId", { value: appDistribution.distributionId })

    new CfnOutput(this, "PhotoBucket", { value: photoBucket.bucketName })
    new CfnOutput(this, "APIEndpoint", { value: photoApi.url })
    new CfnOutput(this, "UploadResource", { value: uploadResource.path })

  }
}