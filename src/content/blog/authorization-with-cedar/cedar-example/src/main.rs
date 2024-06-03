use cedar_policy::{
    Authorizer, Context, Decision, Entities, Entity, EntityUid, PolicySet, Request,
    RestrictedExpression, Schema,
};
use std::collections::{HashMap, HashSet};
use std::str::FromStr;

#[derive(Debug)]
pub struct User {
    pub name: String,
    pub id: i64,
}

#[derive(Debug)]
pub struct Order {
    pub id: i64,
    pub placed_by: i64,
    pub num_pizzas: i8,
}

#[derive(Debug)]
pub enum Action {
    PlaceOrder,
    ViewOrder,
}

/// Convenience method to convert a type into an Entity.
///
/// ```
/// let user = User { name: "Alice".to_string(), id: 1 };
/// let id = id_to_entity_id(user.id, "User");
/// ```
pub fn id_to_entity_id(id: i64, entity_type: &str) -> EntityUid {
    let id = format!("{}::\"{}\"", entity_type, id);
    EntityUid::from_str(&id.to_string()).expect("failed to map to entity id")
}

impl From<&User> for Entity {
    fn from(user: &User) -> Self {
        let uid = id_to_entity_id(user.id, "UserPrincipal");
        let attr = HashMap::new();
        let parents = HashSet::new();
        Entity::new(uid, attr, parents).unwrap()
    }
}

impl From<&Order> for Entity {
    fn from(order: &Order) -> Self {
        let uid = id_to_entity_id(order.id, "Order");
        let attr = {
            let mut attr = HashMap::new();
            attr.insert(
                "placedBy".to_owned(),
                RestrictedExpression::new_entity_uid(id_to_entity_id(
                    order.placed_by,
                    "UserPrincipal",
                )),
            );
            attr
        };
        let parents = HashSet::new();
        Entity::new(uid, attr, parents).unwrap()
    }
}

impl From<Action> for Entity {
    fn from(action: Action) -> Self {
        let id = match action {
            Action::PlaceOrder => "PlaceOrder",
            Action::ViewOrder => "ViewOrder",
        };
        let id = format!("Action::\"{}\"", id);
        let uid = EntityUid::from_str(&id.to_string()).expect("failed to map to action id");
        let attr = HashMap::new();
        let parents = HashSet::new();
        Entity::new(uid, attr, parents).unwrap()
    }
}

const POLICIES: &'static str = include_str!("./policy.cedar");
const SCHEMA: &'static str = include_str!("./policy.cedarschema");

fn authorize(request: Request, entities: Vec<Entity>, schema: &Schema) -> Decision {
    let policy_set = PolicySet::from_str(POLICIES).expect("failed to parse policies");
    let authorizer = Authorizer::new();
    let response = authorizer.is_authorized(
        &request,
        &policy_set,
        &Entities::from_entities(entities, Some(schema)).expect("failed to create entities"),
    );
    response.decision()
}

fn authorize_place_order(user: &User, schema: &Schema) -> Decision {
    let user_entity = Entity::from(user);
    let action_entity = Entity::from(Action::PlaceOrder);
    let request = Request::new(
        Some(user_entity.uid()),
        Some(action_entity.uid()),
        None,
        Context::empty(),
        Some(schema),
    )
    .expect("failed to create request");
    let entities = vec![user_entity];
    authorize(request, entities, schema)
}

fn authorize_view_order(user: &User, order: &Order, schema: &Schema) -> Decision {
    let user_entity = Entity::from(user);
    let action_entity = Entity::from(Action::ViewOrder);
    let order_entity = Entity::from(order);
    let request = Request::new(
        Some(user_entity.uid()),
        Some(action_entity.uid()),
        Some(order_entity.uid()),
        Context::empty(),
        Some(schema),
    )
    .expect("failed to create request");
    let entities = vec![user_entity, order_entity];
    authorize(request, entities, schema)
}

fn main() {
    let john = User {
        name: "John".to_owned(),
        id: 1,
    };
    let alice = User {
        name: "Alice".to_owned(),
        id: 2,
    };

    let order = Order {
        placed_by: 1,
        num_pizzas: 2,
        id: 10,
    };
    let (schema, _) = Schema::from_str_natural(SCHEMA).expect("failed to parse schema");

    // John can place an order
    assert!(matches!(
        authorize_place_order(&john, &schema),
        Decision::Allow
    ));
    // John can view his own order
    assert!(matches!(
        authorize_view_order(&john, &order, &schema),
        Decision::Allow
    ));
    // Alice cannot view John's order
    assert!(matches!(
        authorize_view_order(&alice, &order, &schema),
        Decision::Deny
    ));
}
