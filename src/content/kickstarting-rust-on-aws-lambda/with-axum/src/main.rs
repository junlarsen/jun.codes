use axum::extract::Query;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use lambda_http::tracing::init_default_subscriber;
use serde::Deserialize;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), lambda_runtime::Error> {
    init_default_subscriber();
    let service = Router::new().route("/", get(handler));
    lambda_http::run(service).await?;
    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct HelloQuery {
    pub name: Option<String>,
}

async fn handler(Query(path): Query<HelloQuery>) -> impl IntoResponse {
    let response = json!({
        "message": format!("Hello, {}!", path.name.unwrap_or("anonymous".to_owned())),
    });
    Json(response)
}
