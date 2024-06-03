use aws_lambda_events::apigw::{ApiGatewayV2httpRequest, ApiGatewayV2httpResponse};
use aws_lambda_events::encodings::Body;
use lambda_runtime::tracing::init_default_subscriber;
use lambda_runtime::{service_fn, LambdaEvent};

#[tokio::main]
async fn main() -> Result<(), lambda_runtime::Error> {
    init_default_subscriber();
    let service = service_fn(handler);
    lambda_runtime::run(service).await?;
    Ok(())
}

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
