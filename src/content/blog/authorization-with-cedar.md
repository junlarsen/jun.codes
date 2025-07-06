---
title: "Tutorial: Authorization with the Cedar Policy Framework"
description: A small walkthrough of the Cedar Policy framework for authorization in Rust.
date: 2024-05-28
tags:
  - Rust
  - Cloud-native
published: true
---

[Cedar Policy][cedar-policy] is a policy engine and language for building authorization systems. It's free, open-source,
licensed under the Apache 2.0 license, and is designed to be highly configurable and expressive. Cedar is written in
Rust, but can be used from other languages including Go, Java, or TypeScript. It's primarily developed by Amazon Web
Services (AWS) for their [Amazon Verified Permissions][awsvp] service. This post will give you an introduction to
Cedar's authorization model, and how you can use Cedar to build your authorization layer.

## Why Cedar?

Authorization is a critical part of any application, and it's important to get it right. A good authorization system
should be easy to understand, easy to test, and easy to maintain. It should also be flexible enough to handle more
complex cases as your application(s) grow.

Many authorization frameworks exist, with popular choices including Open Policy Agent (OPA), or Casbin in addition to
Cloud-based solutions like AWS Verified Permissions, or AWS Cognito Authorizers.

I recently chose Cedar for an application service written in Rust. It felt like a good fit because of its simple yet
expressive language, and the fact that it's written in the same language as my service; Rust. I also considered Casbin
and OPA, but I decided that Cedar would be easier to integrate because it's downloadable from Crates.io through Cargo.
It would be a breeze to integrate with my existing Rust codebase, and I wouldn't have to worry about running a separate
service for authorization.

Cloud-based offerings like AWS Verified Permissions are also good choices, but they can quickly become expensive. I did
consider AWS Verified Permissions, most particularly because I'm already building on AWS, but as of time of writing, the
costs of $0.00015 per authorization request (6666 requests per dollar) became more expensive than I was willing to pay.
By running Cedar, which is the same policy engine that AWS Verified Permissions uses, I could save a lot of money,
simplify my infrastructure, and have more control over my authorization system.

> Is one dollar per 6666 requests really that expensive? I would say it depends on the context. I'm building a small
> application that I expect to have a low number of users, and I don't want to pay for something I can get for free. If
> you are a large organization, then the cost might be negligible. I was also not to keen on burning money each time I
> ran my integration tests.

## The PARC Model

Cedar calls its authorization model the PARC model. The model consists of four primary components; the **P**rincial,
**A**ction, **R**esource, and **C**ondition. Each authorization rule is a policy that either permits or denies an
authorization request based on the calling principal, the action being performed, the resource being acted upon, and any
additional conditions that must be met for the policy to evaluate to pass. Using the PARC model, we can express a wide
range of authorization models, from simple role-based access control (RBAC) to more complex rules like those found in
AWS IAM policies. Readers familiar with AWS IAM will find this model familiar, as it closely resembles the way IAM
policies are written.

For this post, we will consider a simple use-case to demonstrate how Cedar can be used. We have a local pizza joint
named "Rusty's Pizza" that offers a REST API for placing and viewing orders. For simplicity, we will not consider the
authentication system behind Rusty's Pizza. We will demonstrate how we can use Cedar to enforce authorization rules for
viewing  and placing orders, rejecting unauthorized requests.

Our first policy permits any user to view an order if they happen to be the same user that placed the order. Using
predicate logic, can write:

$$
\mathrm{Permit}(U, A, O) \iff U = \mathrm{PlacedBy}(O) \wedge A = \mathrm{ViewOrder}
$$

The statement reads that any user `U` is permitted to perform the action `A` on the order `O` if the principal
is the same as the person who placed the order, and the action is `ViewOrder`. We will now explore how we can express
the same constraints using Cedar's policy language.

## The Cedar Policy language

Cedar policies are written in a custom, human-readable language that the Cedar library considers when evaluating
authorization requests. The policies are written in a declarative manner, where each policy is a statement that either
permits or denies an action. The policy language is designed to be simple to write and easy to understand. The following
Cedar policy expresses the constraint we previously wrote using predicate logic.

```sh
permit(
  principal is UserPrincipal,
  action == Action::"ViewOrder",
  resource is Order
)
when {
  resource.placedBy == principal
};
```

Cedar breaks down the policy statement into two parts; the scope and the conditions. The scope is defined by the
`permit` block, which specifies the principal, action, and resource that the policy applies to. The conditions are
defined in the `when` block, expressing any additional constraints that must be met for the rule to evaluate to true.
Our example uses a simple ID comparison to validate ownership, but Cedar supports a
[wide range of operators and functions][cedar-policy-docs] that can be used in the conditions.

The policy refers to two data types, `UserPrincipal` and `Order`. Where do these come from? Cedar does not require you
to declare the types in the policy itself, but you should ensure that the entities passed to the policy match the types
declared in the policy. To the naked eye, it might appear as if Cedar is completely untyped. This is fortunately not the
case. First, Cedar will cause a runtime program error if the entities passed to the policy do not match the types, and
secondly, Cedar highly recommends using schema validation to prevent these errors.

The schema file is a separate file that declares all the legal actions and entity types in order to prevent typos and
mistakes in the policies. More importantly, the schema file can be used to validate the policies at build time,
preventing runtime errors in your authorization infrastructure. The schema file for our example would look like this:

```sh
entity UserPrincipal = {};
entity Order = {
  placedBy: UserPrincipal,
};
action ViewOrder appliesTo {
  principal: UserPrincipal,
  resource: Order,
  context: {},
};
```

The syntax of the schema file resembles JSON with some additional syntax for defining types and actions. For our
example domain, we have declared two entity types, `UserPrincipal` and `Order`, and one action, `ViewOrder`. Because we
need to know who placed the order to evaluate the policy, we've added a `placedBy` attribute to the `Order` type that
references a `UserPrincipal`. Furthermore, the `ViewOrder` action also declares which principal and resource types it
applies to.

> Do you ever need more than one principal type? Yes, you might have different types of principals, such as human users,
> bot users, service accounts, and more. Cedar can guard policies based on the calling principal type.

You might be curious to know how we can compare a `UserPrincipal` with `Order.placedBy` if we don't have any properties
on the `UserPrincipal` type. This is because Cedar implicitly requires a unique entity ID, which is used to do identity
comparison. Because the ID is implicit, it cannot be declared in the schema file.

The context attribute in the action definition is used to pass additional information to the policy evaluation. This
could be used to pass information about the request, such as the IP address of the client making the request, or the
date. The context is a map of arbitrary values that can also be used in the policy conditions. An example context
condition requiring the request to be made from a specific IP address could look like this:

```sh
permit(
  principal is UserPrincipal,
  action == Action::"ViewOrder",
  resource is Order
)
when {
  resource.placedBy == principal &&
  context.ip_address == "192.168.0.1"
};
```

This would also constitute an update to the action definition in the schema file, where we would add a new field to the
context map:

```sh
action ViewOrder appliesTo {
  principal: UserPrincipal,
  resource: Order,
  context: {
    ip_address: String,
  },
};
```

We have now covered the basics of the Cedar policy language and demonstrated the schema validation feature. In the next
section, we will begin using Cedar as a Rust library. We will write a simple program that would act as the authorization
layer for Rusty's Pizza.

## Cedar as a Rust library

We will now build the authorization layer for our pizza joint using Cedar from Rust. For this example, I assume you have
a working Cargo environment, and that you're familiar with Rust. We will start by initializing a new Rust project, and
adding the Cedar dependency.

```sh
cargo init --bin cedar-example && cd cedar-example
cargo add cedar-policy
```

Next, we'll write Rust code to declare the different domain types for our application. We'll declare two types, a `User`
struct, and an `Order` struct. We'll also declare an `Action` enum that represents the different actions that
can be used in our domain.

```rust
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
    CreateOrder,
    ViewOrder,
}
```

You might notice that our Rust types declare more properties than the Cedar types we defined earlier. This is because
there does not have to be a one-to-one mapping from our domain types and the Cedar types. The name of the pizza ordered
is likely not going to be useful in any authorization policy. Not all properties are meaningful for authorization, and
you should only pass the bare minimum required to make authorization decisions. It is up to you to decide how much
information you want to pass to the policy evaluation. Keeping the authorization types slim reduces complexity and
increases maintainability. Furthermore, you can always add more information to a specific action using the context
attribute as previously discussed.

Next, we will take a closer look at the Cedar APIs that we will be using to evaluate policies. The Cedar runtime
provides a [`cedar_policy::Request`][docsrs-request] type that represents an authorization request to be decided by the
evaluation engine. The constructor function signature for the `Request` type is as follows:

```rust
pub fn new(
    principal: Option<EntityUid>,
    action: Option<EntityUid>,
    resource: Option<EntityUid>,
    context: Context,
    schema: Option<&Schema>,
) -> Result<Request, RequestValidationError>
```

The function takes an optional principal, action, and resource, as well as a context map and a reference to the schema
that the policy may be validated against. The `EntityUid` type is a wrapper around a string that represents the
unique ID of an entity. Entity IDs are namespaced by the type of entity, and the ID itself. For example, the ID of a
`User` entity with the ID 1 would be `User::"1"`, while being distinct from the `Order::"1"` entity ID. Observant
readers might question how we can provide additional properties for the entities, if we are only providing the IDs.
These IDs are only used to match the correct entity, as Cedar accepts a set of complete
[`cedar_policy::Entity`][docsrs-entity] objects to the policy evaluation.

The principal, action, and resource scopes are optional, as it's not always the case that you have or need all of them.
Perhaps, some are insignificant for the policy evaluation, or perhaps you're evaluating a policy that doesn't require
a resource, such as creating a new resource, or validating an incoming IP address. The context map is a map of arbitrary
values that can be used in the conditions as previously discussed.

The schema is optional, but highly recommended, as it can be used to validate policies at build time like we discussed
earlier. In cases where you do not want to do policy validation, you will pass `None` as the schema argument.

The next step is to map our domain types to Cedar entities, as these are the types that will be used in the policy
evaluation. The Cedar API is not generic over types, but requires everything to be of the concrete `Entity` type. 
Therefore, we will  provide `From<&User>` and `From<&Order>` implementations, and `From<Action>` for the `Entity`
type.

> We take a reference of User and Order, since we don't necessarily want to move the objects when constructing the
> authorization request. It's fine to take Action by value, as it's an enum and is cheap to clone.

```rust
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
                RestrictedExpression::new_entity_uid(id_to_entity_id(order.placed_by, "UserPrincipal")),
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
```

In the above snippet, I've taken a few shortcuts by `.expect`ing on various functions. In a real-world scenario, you
would likely want to propagate these errors up the call stack, or handle them in a more graceful manner. The
`id_to_entity_id` function is a helper function that constructs a unique entity ID from an integer ID and an entity
type.

The `Entity` constructor takes three arguments, the unique ID of the entity, a map of attributes, and a set of parent
entities. The attributes map is used to store the properties of the entity that we defined in our schema. Parents are
a more advanced Cedar feature I won't cover in this post, but they can be used to define hierarchal relationships
between entities. For example, a `Principal` entity could, for example, be either `UserPrincipal` or `MachinePrincipal`.

In our schema we've defined the User type without any attributes, and as such, we're leaving an empty HashMap for the
attributes, while Order receives a placedBy attribute that is a reference to a User entity. As Cedar has its own defined
data types, we build [`RestrictedExpression`][docsrs-resexp] objects. `RestrictedExpression` is used by Cedar to limit
the values that can be used in the attributes map. In this case, we're using the `new_entity_uid` constructor to store a
reference to another entity.

We update our Cedar policies and schema to include the new PlaceOrder action. As placing an order does not affect any
existing resource, we simply omit any details on the `resource` scope in the policy definition.

**policy.cedar**
```sh
permit(
  principal is UserPrincipal,
  action == Action::"ViewOrder",
  resource is Order
)
when {
  resource.placedBy == principal
};

permit(
  principal is UserPrincipal,
  action == Action::"PlaceOrder",
  resource
);
```

**policy.cedarschema**
```sh
entity UserPrincipal = {};
entity Order = {
  placedBy: UserPrincipal,
};
action PlaceOrder appliesTo {
  principal: UserPrincipal,
  context: {},
};
action ViewOrder appliesTo {
  principal: UserPrincipal,
  resource: Order,
  context: {},
};
```

We can now include the policies in our Rust program. In this example, we will take a shortcut and encode the policies
and schema into the binary program, but for a real-world task you should read them at runtime to avoid recompilation
and deployment when a policy needs to be changed.

```rust
const POLICIES: &'static str = include_str!("./policy.cedar");
const SCHEMA: &'static str = include_str!("./policy.cedarschema");
```

To test our policies and schema, we will write a main function that constructs a request and evaluates it against the
engine.

```rust
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
```

Running our program with cargo should exit successfully, as all the assertions pass. We have now successfully built
a simple authorization system using the Cedar Policy framework in Rust.

```sh
cargo run --release && echo "All tests passed"
```

## Bonus Features

As previously mentioned, Cedar provides a set of developer tools that can be used to validate policies against a schema
at build time. This can be done by using the `cedar-policy-cli` tool, which can be installed from Cargo.

```sh
cargo install cedar-policy-cli
```

The command line tool can be used to validate policies, format policy files, test authorization, and more. It makes the
life of a Cedar developer much easier, as it can catch problems early and provide a better developer experience. We can
use the tool to validate our policies and schema like this:

```sh
$ cedar validate -p src/policy.cedar -s src/policy.cedarschema --schema-format human
  ☞ policy set validation passed
  ╰─▶ no errors or warnings
```

## Conclusion

Cedar is a powerful policy framework that can be used to implement complex authorization rules with great developer
tooling. It might not be as well adopted as Casbin or OPA, but it's an excellent choice for Rust developers who want to
enforce authorization rules in their applications.

I'm personally very happy with Cedar for my use case, and I'm looking forward to seeing how the project evolves in the
future. I hope this post has given you a good introduction to Cedar, and that you feel confident to start using it
yourself.

The full code listing for this example can be found on [GitHub][source].

[cedar-policy]: https://www.cedarpolicy.com/en
[awsvp]: https://aws.amazon.com/verified-permissions/
[cedar-policy-docs]: https://docs.cedarpolicy.com/policies/syntax-policy.html
[docsrs-entity]: https://docs.rs/cedar-policy/latest/cedar_policy/struct.Entity.html
[docsrs-request]: https://docs.rs/cedar-policy/latest/cedar_policy/struct.Request.html
[docsrs-resexp]: https://docs.rs/cedar-policy/latest/cedar_policy/struct.RestrictedExpression.html
[source]: https://github.com/junlarsen/jun.codes/blob/main/src/content/blog/authorization-with-cedar/cedar-example/src/main.rs
