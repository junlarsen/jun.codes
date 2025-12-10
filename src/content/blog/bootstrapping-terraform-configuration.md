---
title: "Bootstrapping Terraform"
description: An idea on how to bootstrap terraform projects, and keep a full track record of everything.
date: 2025-12-10
tags:
  - Terraform
  - Cloud-native
published: true
---

I have been working with Terraform for several years now on a number of
projects. This is a short post explaining my preferred way of bootstrapping a
brand new Terraform project for an organization.

## A place for the Terraform state file

Each time we modify Terraform code, we effectively modify an internal state
representation that Terraform has for our infrastructure. Terraform uses this
state to generate the diffs that we review during `terraform plan`. This state
often holds sensitive variables, such as account identifiers, temporary
passwords or keys, or other information we don't wish to commit to version
control.

Terraform uses a state backend to determine how the Terraform state is
preserved, and supports a number of options from blob storage (such as AWS S3,
as a Kubernetes secret, or simply a local file). If we use a remote backend
such as S3 or Kubernetes, we can implement sufficient authorization and
access control policies and our problem is mostly solved.

However to be able to use one of these remote backends (which you would
consider pieces of infrastructure themselves) and if you are like me, you will
prefer to also define the S3 bucket used to store the Terraform state in
Terraform. This is now a chicken-and-egg problem - we want to store the state
in a bucket, but to be able to create said bucket, we need an already-existing
and configured Terraform project.

## Let's use multiple projects

To solve our problem, we simply introduce another Terraform project. The sole
purpose of this new Terraform project is to provision the AWS S3 bucket (and
optionally DynamoDB table for state locking) so that the main project can be
configured using these resources as the state backend. I typically put this
inside a folder named `bootstrap` with a short README document on why it
exists.

```bash
bootstrap/
  .terraform.lock.hcl
  bootstrap.tf
  bootstrap.tfstate
  README.Md
infra/
  .terraform.lock.hcl
  terraform.tf
  ...
```


The bootstrap project will use the local file backend, which we will commit
to version control. Since neither the S3 bucket name or DynamoDB table name
would be considered sensitive data, we should be OK with keeping them in
version control. Once bootstrapped, the bootstrap Terraform project is likely
not to be touched ever again (apart from Terraform provider version updates).

This leaves us with all resources declared using Terraform, and no pesky
buckets manually created in the console.

This simple approach makes it really easy to destroy all the resources
associated in the project if you go bankrupt and have to shut down too :)
