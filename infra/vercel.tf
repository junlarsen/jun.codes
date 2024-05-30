resource "vercel_project" "web" {
  name      = "web"
  framework = "nextjs"

  git_repository = {
    production_branch = "main"
    type              = "github"
    repo              = "junlarsen/jun.codes"
  }

  build_command              = "pnpm build"
  serverless_function_region = "arn1"
}

resource "vercel_project_domain" "jun_codes" {
  domain     = aws_route53_record.jun_codes_a.name
  project_id = vercel_project.web.id
}
