---
title: Kickstarting Rust on AWS Lambda
description: A guide to building Rust services from scratch and deploying them on AWS Lambda.
date: 2024-05-31
tags:
  - Rust
  - AWS
  - Cloud-native
published: true
---

[AWS Lambda][aws-lambda] is a serverless compute service that lets you run code without having to deal with servers. It
has gained popularity for its cost-effectiveness, scalability, and has been known for its ease of use with established
programming languages like Python, JavaScript, and Java. However, it hasn't always been straightforward to use with
Rust, a language that has gained popularity and a huge following over the past few years. In this post, we'll explore
how to build AWS Lambda functions with Rust, and how easy it is to deploy them using Terraform.

I'll also add a disclaimer that neither Rust or AWS Lambda are a silver bullet for all use cases, but this post is not
about whether you should use Rust or AWS Lambda. It's about how well the two ecosystems come together.

Throughout the guide, we will begin with a small function that responds to an incoming AWS Lambda event, and then we
will step it up by showing how any [Tower][tower-rs] service can be deployed using the same tools. If you intend on
following along, you will need to have a working Rust and Cargo environment, an AWS account, and [Terraform][terraform]
installed on your machine. I'm assuming familiarity with all three tools, but I'll try to explain things as we go along.

## Tools and the ecosystem

Thanks to Amazon's [aws-lambda-rust-runtime][aws-rust-runtime] project, we finally have a first-party runtime and
support libraries for running Rust on AWS Lambda. The project provides a runtime that can be used to build Lambda
functions, as well as support code for collecting logs and traces. It's built on the [Tokio][tokio-rs] stack with
[Tracing][tracing-rs] instrumentation, configured for AWS CloudWatch out-of-the-box.

Other community efforts like [Rocket Lamb][rocket-lamb-rs] made it possible to run applications built with the Rocket
web framework on AWS Lambda, and other projects have enabled similar efforts. However, the official runtime is the most
flexible, generic, and most straightforward way to go these days. With the combination of the runtime and the newest
Amazon Linux 2023 images, we can now build and deploy Rust services with a small footprint with ease.

[The minimal Amazon Linux 2023][al2023] image is a stripped-down version of Amazon Linux 2 that bundles only the
operating system, making it perfect for container workloads. It weighs just over 35MB, which is a significant reduction
from the 100MB+ sizes of the old Amazon Linux 2 images. While other base images like [Alpine Linux][alpine] and
[Distroless][distroless] are popular and significantly smaller, the Amazon Linux 2023 image is a fair choice, as it's
tightly integrated with AWS services, and available for AWS Lambda out-of-the-box. This can reduce the overhead of
building and cross-compiling Docker images for AWS Lambda, and it can simplify the deployment process of small tools
and applications for a small size trade-off.

We will be using [the Cargo Lambda extension][cargo-lambda] for building and packaging our Rust Lambda functions. Cargo
Lambda makes it dead simple to build your Lambda functions, and it significantly simplifies cross compilation. It also
provides to test your Lambda functions locally, and it can even be used to deploy your functions to AWS Lambda. In this
guide we will only be using it to build our functions, as we will be deploying them using Terraform.

## Building your first Rust Lambda function

Our first Lambda function will make use of the official runtime in addition to the
[aws_lambda_events crate][aws-lambda-events] for strongly-typed AWS Lambda events. We will build a simple function that
responds to an incoming AWS API Gateway event with a "Hello, World!" message. The Lambda function will be deployed using
[AWS Lambda Function Urls][lambda-urls], which is a feature that allows you to invoke Lambda functions over HTTP,
without having to configure an API Gateway. Conveniently enough, the event input and output are the same as the ones
for AWS API Gateway events.

I will begin with a new Rust project, to which I'll add the Rust runtime, Tokio, Serde, and Tracing libraries.

```sh
cargo new rust-lambda && cd rust-lambda
cargo add aws_lambda_events
cargo add tokio --features full
cargo add lambda_runtime --features tracing
```

The `lambda_runtime` crate contains the main runtime, while `aws_lambda_events` contains the event types for AWS Lambda.
We also grab Tokio because the runtime depends on it, plus Tokio is awesome. The runtime crate already bundles tracing
and tower, so we don't need to add them explicitly. You might want to add them in the future if you directly need to
access items from those crates, but I'll leave them out since we're just doing the bare minimum here.

Next, we're going to add a simple function that responds to an incoming API Gateway message. We'll keep it dead simple
and return `"Hello from {path}"`. I'm keeping it simple with the response, but you could do as much processing as you'd
like here. Maybe you'll establish a database connection, or you'll call another service.

```rust
use aws_lambda_events::apigw::{ApiGatewayV2httpRequest, ApiGatewayV2httpResponse};
use aws_lambda_events::encodings::Body;
use lambda_runtime::LambdaEvent;

async fn handler(
    event: LambdaEvent<ApiGatewayV2httpRequest>,
) -> Result<ApiGatewayV2httpResponse, lambda_runtime::Error> {
    Ok(ApiGatewayV2httpResponse {
        status_code: 200,
        body: Some(Body::Text(format!(
            "Hello from {}",
            event
                .payload
                .request_context
                .http
                .path
                .unwrap_or("/".to_owned())
        ))),
        ..Default::default()
    })
}
```

With our handler in place, we can now create the main function that will run the Lambda function. As previously
mentioned, the entire runtime is built on top of Tower services. The runtime provides a `lambda_runtime::service_fn`
function that can be used to wrap our handler function into a `ServiceFn<_>`. In addition, the runtime also implements
the `tower::Service` trait for `Service<LambdaEvent<A>>` where `A` is any Serde deserializeable type. As Tower's
`ServiceFn` is a service, we can feed the service function directly into the runtime with `lambda_runtime::run`.

```rust
use lambda_runtime::service_fn;
use lambda_runtime::tracing::init_default_subscriber;

#[tokio::main]
async fn main() -> Result<(), lambda_runtime::Error> {
    init_default_subscriber();
    let service = service_fn(handler);
    lambda_runtime::run(service).await?;
    Ok(())
}
```

I've added a call to `init_default_subscriber` which initializes a default tracing_subscribed with options that are
suitable for AWS Lambda. This is completely optional, and if you'd like to configure your own subscriber, you are more
than welcome to do so.

With 30 lines of code, we have successfully built a Tower service that will respond to incoming Lambda Function Url
invocations. As this is "just another Tower service", you can add any middleware, filters, or layers that you'd like.
The possibilities going forward are endless, and you can build anything from a simple event trigger for an AWS service
like AWS Cognito, to a full-blown web application or microservice. We'll explore more of these possibilities later, but
first we will package and deploy the function.

## Deployment with Terraform

We can now build and package our function using the Cargo Lambda extension. As previously mentioned, Cargo Lambda is
optional, but it hides some complexity and makes packaging through Terraform very easy. To build the function, we'll
install Cargo Lambda with Cargo, and then we'll build the function. The same concepts obviously apply if you're using
CDK, CloudFormation templates, or any other deployment tool, or even the AWS console.

```sh
# Install Cargo Lambda
cargo install cargo-lambda --locked

# Build the function. By default, Cargo Lambda will install Zig and use Zig as the linker. If you're interested in that,
# you can omit the `--compiler cargo` option. Using Cargo as the compiler won't require you to install additional build
# tools.
cargo lambda build --release --compiler cargo
```

The build command will build your application in release mode, and store the resulting binary into
`target/lambda/release/bootstrap`. This binary is the entrypoint for your Lambda function, and it's what you'll be
archiving and deploying directly to AWS Lambda. As previously mentioned, we're going to be using the Amazon Linux 2023
runtime, but if you prefer to build Docker images, you are of course free to do so. Next, we'll configure Terraform to
deploy the function. If you are not planning on using Terraform, you can skip this section and
[head over to the Web Services on Lambda with Axum section](#web-services-on-lambda-with-axum).

```terraform
terraform {
  backend "s3" {
    bucket = "my-awesome-s3-bucket"
    key    = "rust-lambda.tfstate"
    region = "eu-north-1"
  }

  required_version = "~> 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.52"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
}
```

I'm using an S3 backend for storing the Terraform state, but you can use any backend you'd like. I've also used the
eu-north-1 (Stockholm) region, but you can use any region you'd like. Next, we'll use an `archive_file` data source to
create a ZIP archive of our Lambda function, and we'll use the `aws_lambda_function` resource to deploy the function.
We're also going to need an IAM role for the Lambda function, and we'll have to assume `lambda.amazonaws.com` as the
service principal.

We will attach the `AWSLambdaBasicExecutionRole` policy to the role, which is a managed policy that allows the Lambda
function to do basic things like creating and writing to CloudWatch logs.

```terraform
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execute_role" {
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  name               = "kickstarting-rust-on-aws-lambda-execute-role"
}

# Attach the managed service policy to the newly created role
resource "aws_iam_role_policy_attachment" "lambda_execute" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_execute_role.name
}

data "archive_file" "bootstrap" {
  type        = "zip"
  source_dir  = "target/lambda/rust-lambda"
  output_path = "dist/rust-lambda.zip"
}

resource "aws_lambda_function" "this" {
  function_name = "kickstarting-rust-on-aws-lambda"
  role          = aws_iam_role.lambda_execute_role.arn

  filename         = data.archive_file.bootstrap.output_path
  source_code_hash = data.archive_file.bootstrap.output_base64sha256

  runtime     = "provided.al2023"
  handler     = "bootstrap"
  timeout     = 10
  memory_size = 256

  environment {
    variables = {
      RUST_BACKTRACE        = "1",
      RUST_LOG              = "trace",
      AWS_LAMBDA_LOG_FORMAT = "json",
      AWS_LAMBDA_LOG_LEVEL  = "trace"
    }
  }
}

# For the sake of completeness, we'll also create a CloudWatch log group
resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/${aws_lambda_function.this.function_name}"
  retention_in_days = 7
}
```

In addition to the points above, we've used the `provided.al2023` runtime, which is the identifier for Amazon Linux 2023
and we've allocated 256MB of memory to the function. We've also set the `RUST_BACKTRACE` which enables backtraces in
case of a panic, and we've added `AWS_LAMBDA_LOG_FORMAT` and `AWS_LAMBDA_LOG_LEVEL` to configure the logging format and
level. The Lambda runtime library uses these environment variables to configure the default tracing subscriber that we
installed in the main function.

With the Terraform configuration in place, we deploy with `terraform apply`, and if all goes well, you should see the
function deployed in the AWS Lambda console. You can now invoke the function using the console, but it's currently not
exposed to the internet. For this purpose we will use Function Urls, but you would be free to use CloudFront, API
Gateway, or any other service that can invoke Lambda functions.

In this example, we'll set the required authorization type for invoking the Function Url to `NONE`, which means that
anybody can invoke the function. If you're interested in [securing your function with IAM][lambda-sec], you can do so
by setting the authorization type to `AWS_IAM`. This will require more configuration that is out of scope for this
demonstration. Be aware that with the `NONE` authorization type and the IAM policy we will create, anybody can invoke
the function and incur charges on your account.

As hinted towards, simply setting the authorization type to `NONE` is not sufficient alone, as you will need a separate
IAM policy on the execution role that allows the `lambda:InvokeFunctionUrl` action. We'll set up the policy along with
the Function Url itself now.

```terraform
resource "aws_lambda_function_url" "this" {
  function_name      = aws_lambda_function.this.function_name
  authorization_type = "NONE"
}

data "aws_iam_policy_document" "execution" {
  statement {
    effect    = "Allow"
    actions   = ["lambda:InvokeFunctionUrl"]
    resources = [aws_lambda_function.this.invoke_arn]
  }
}

resource "aws_iam_policy" "public_invoke" {
  policy = data.aws_iam_policy_document.execution.json
  name   = "kickstarting-rust-on-aws-lambda-execute-policy"
}

resource "aws_iam_role_policy_attachment" "public_invoke" {
  policy_arn = aws_iam_policy.public_invoke.arn
  role       = aws_iam_role.lambda_execute_role.name
}

output "url" {
  value = aws_lambda_function_url.this.function_url
}
```

With the Function Url and the IAM policy in place, you can now invoke the function using the URL. You can find the URL
in the Terraform output, or in the AWS Lambda console. Visiting the URL in your browser should return a "Hello from /".
You can play around with the output by changing the path in the URL.

You should also be careful with public Function Urls. While they are convenient for easily testing things, they can
easily be abused by malicious actors. If you're planning on using the function in production, you should consider
securing it through either IAM_AUTH, through a service like AWS API Gateway, or by proxying through another service like
CloudFront where you can add additional security measures.

With the function deployed and working, we'll now move onto building a more complete API service using the Axum
framework.

The code at this point in time can be found [on GitHub][code-service-fn].

## Web Services on Lambda with Axum

[The Axum framework][axum-rs] is a web framework built on top of the Tokio, Tower, and Tower HTTP stacks. The project
lies under the Tokio organization, and it's built on technologies we're already using. It's also instrumented with
Tracing, which makes it a perfect fit. This time we'll re-built the Lambda function using Axum, and we'll use the
`lambda_http` crate to adapt the Axum service to a Tower service that can be passed to the Lambda runtime.

First, we'll add the necessary dependencies to our project.

```rust
cargo add axum --features json,tracing,query
cargo add lambda_http --features tracing
cargo add serde serde_json
```

Next, we'll replace our old handler function with an Axum route handler. We'll also create a typed query struct that
will hold the deserialized search query parameters. We'll use the `query` feature of Axum to automatically deserialize
the query parameters into the struct.

```rust
use axum::extract::Query;
use axum::handler::get;
use axum::response::IntoResponse;
use axum::{Json, Response};
use serde::Deserialize;
use serde_json::json;

#[derive(Debug, Deserialize)]
pub struct HelloQuery {
    pub name: Option<String>,
}

/// Handler that will respond to requests at /?name={name}
async fn handler(Query(path): Query<HelloQuery>) -> impl IntoResponse {
    let response = json!({
        "message": format!("Hello, {}!", path.name.unwrap_or("anonymous".to_owned())),
    });
    Json(response)
}
```

The handler function is similar to the old implementation, and we could achieve the same result if we used Axum's
fallback routes. However, I decided that using a query extractor would be simpler, as the ergonomics of Axum is not what
we're focusing on.

With the handler in place, we can now create the main function. Because Axum integrates with Tower, and the Lambda
runtime is built on Tower, it becomes very easy to adapt the Axum service to a Tower service. We'll use the following
diff:

```diff
-     let service = service_fn(handler);
-     lambda_runtime::run(service).await?;
+     let service = Router::new().route("/", get(handler));
+     lambda_http::run(service).await?;
```

We've replaced the `service_fn` with an Axum router, and instead of using the `lambda_runtime::run` function, we're now
using the `lambda_http::run` function. The `lambda_http::run` function is a thin wrapper around the
`lambda_runtime::run` function, and it's specifically made for `tower::Service<http::Request, R, E>` services. Since
Axum is built on top of this stack, it's a match made in heaven.

Because it's all just Tower services, we don't need to change anything in our deployment process. The Lambda runtime
will work as it did before, and the function will be deployed in the same way. The only thing that changes is the
framework we're using, and how we're providing the Tower service to the runtime.

## Conclusion

We have built two small services that respond to incoming AWS Lambda Function Url events. The first one was a simple
Tower service built from scratch, while the second one used the more feature-rich Axum framework. Since both services
are built on Tower, they integrate seamlessly with the Lambda runtime, and they can be deployed in the same way. We
have deployed our functions using Terraform, and invoked the lambdas using Function Urls.

The services we built are very simple, but the possibilities are endless. I'm personally running a few services using
a similar setup through CloudFront, and I've been pleased with the results. The services are fast, cheap, and they're
easy to maintain. Remember that these services are generally stateless, and they're not suitable for long-running
tasks, but they work well for a lot of short workloads like serving HTTP requests, or responding to events from other
AWS services.

I hope this walkthrough has been helpful, and that you've seen how easy it is to get started with Rust on AWS Lambda.
Hopefully you feel inspired to try it out yourself.

As always, the full code listings for both the Tower service function, and Axum service can be [found on GitHub][code].

[aws-lambda]: https://aws.amazon.com/lambda/
[aws-rust-runtime]: https://github.com/awslabs/aws-lambda-rust-runtime
[tower-rs]: https://docs.rs/tower
[axum-rs]: https://docs.rs/axum
[tokio-rs]: https://tokio.rs/
[tracing-rs]: https://docs.rs/tracing
[aws-lambda-events]: https://docs.rs/aws_lambda_events
[rocket-lamb-rs]: https://github.com/GREsau/rocket-lamb
[terraform]: https://www.terraform.io/
[al2023]: https://docs.aws.amazon.com/linux/al2023/ug/minimal-container.html
[alpine]: https://alpinelinux.org/
[distroless]: https://github.com/GoogleContainerTools/distroless
[lambda-urls]: https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html
[cargo-lambda]: https://www.cargo-lambda.info/
[lambda-sec]: https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html
[code]: https://github.com/junlarsen/website/blob/main/src/content/kickstarting-rust-on-aws-lambda/
[code-service-fn]: https://github.com/junlarsen/website/blob/main/src/content/blog/kickstarting-rust-on-aws-lambda/with-service-fn/
[code-axum]: https://github.com/junlarsen/website/blob/main/src/content/blog/kickstarting-rust-on-aws-lambda/with-axum/
