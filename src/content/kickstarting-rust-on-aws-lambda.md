---
title: Kickstarting Rust on AWS Lambda
description: A guide to building Rust services from scratch and deploying them on AWS Lambda.
date: 2024-05-31
tags:
  - rust
  - aws
  - cloud-native
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

[aws-lambda]: https://aws.amazon.com/lambda/
[aws-rust-runtime]: https://github.com/awslabs/aws-lambda-rust-runtime
[tower-rs]: https://docs.rs/tower
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
