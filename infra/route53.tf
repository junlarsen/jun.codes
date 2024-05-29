data "aws_route53_zone" "jun_codes" {
  name = "jun.codes"
}

resource "aws_route53_record" "jun_codes_a" {
  name    = "jun.codes"
  type    = "A"
  ttl     = 3600
  zone_id = data.aws_route53_zone.jun_codes.zone_id
  records = [
    "76.76.21.21"
  ]
}

resource "aws_route53_record" "www_jun_codes_cname" {
  name    = "www.jun.codes"
  type    = "CNAME"
  ttl     = 3600
  zone_id = data.aws_route53_zone.jun_codes.zone_id
  records = [
    "cname.vercel-dns.com"
  ]
}
