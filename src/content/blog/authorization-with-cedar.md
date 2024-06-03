---
title: Authorization with the Cedar Policy Framework
description: A small walkthrough of the Cedar Policy framework for authorization in Rust.
date: 2024-05-28
tags:
  - rust
  - cloud-native
published: true
---

[Cedar Policy][cedar-policy] is a policy toolkit for highly configurable authorization rules written in Rust. It
is completely open-source, and can be used from a number of languages, including Rust, Go, Java, and TypeScript. It's
backed by Amazon Web Services (AWS) who uses Cedar for their [Amazon Verified Permissions][awsvp] service. This blog
post will introduce you to Cedar's authorization model, and how you can use Cedar from the Rust programming language.

## Why Cedar?

There are several options for authorization frameworks out there, including Casbin, Open Policy Agent (OPA), as well as
Cloud-based solutions like AWS Verified Permissions, or AWS Cognito with authorizer Lambdas.

I recently chose Cedar for a Rust application because of its expressive language, simplicity, and the fact that it is
written in Rust. I had also considered Casbin and OPA, but I decided that Cedar would be a great fit for my use case
because I could download it with Cargo, and it was easy to integrate with my existing Rust codebase.

Cloud-based soltions like AWS Verified Permissions can be viable options, especially if you're already using AWS, but
they can be very expensive, you might want to avoid vendor lock-in, you might want easy testing, and you might want to
have more control over your authorization infrastructure. At the time of writing, AWS Verified Permissions costs
$0.00015 per authorization request (6666 requests per dollar), which can add up quickly. By running engines like Cedar,
Casbin, or OPA in your own infrastructure, you can save a lot of money, and have more control over your systems.

## The PARC Model

Cedar uses a PARC model for authorization. PARC stands for _Principal_, _Action_, _Resource_, and _Condition_. The idea
is that each authorization rule is a statement that either permits or denies an action based on the principal, action,
resource, and additional conditions in the request. Using PARC, it is possible to express standard authorization models
like Role-Based Access Control (RBAC), build complex rules akin to AWS IAM policies, or keep things stupid simple with
simple rules like "Any user can view job listings". Users familiar with AWS IAM will find the PARC model very familiar,
as it closely resembles the way IAM policies are written.

For this post, we'll consider a simple domain where we have users who can place and view orders on pizza from a local
pizza joint. We'll consider two domain types, a _User_ and an _Order_. They are related in that a user can place an
order, and an order is placed by a user. To begin with, we will consider a policy that should allow a user to view an
order, given that the user is the same person who placed the order. Using predicate logic, this statement can be
expressed as follows:

$$
\mathrm{Permit}(U, A, O) \iff U = \mathrm{PlacedBy}(O) \wedge A = \mathrm{ViewOrder}
$$

The statement reads that any user `U` is permitted to perform the action `A` on the order `O` if the principal
is the same as the person who placed the order, and the action is `ViewOrder`. We will now explore how we can express
the same constraint in Cedar's policy language.

## The Cedar Policy language

Cedar policies are written in a custom, human-readable language that the Cedar runtime parses and evaluates. The
policies are written in a declarative style, where each policy is a statement that either permits or denies an action
based on the PARC inputs. The policy language is designed to be simple to write and easy to understand. The following
policy expresses our predicate logic in Cedar's policy language:

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

We can break down the policy statements into two parts; the scope and the conditions. The scope is defined by the
`permit` block, which specifies the principal, action, and resource that the rule applies to. The conditions are defined
by the `when` block, which expresses any additional constraints that must be met for the rule to evaluate to true. Our
example uses a simple ID comparison to validate ownership, but Cedar supports a
[wide range of operators and functions][cedar-policy-docs] that can be used in the conditions.

Our policy refers to two types, `UserPrincipal` and `Order`, which are not defined in the policy itself (but where?).
Cedar does not require you to define the types, but they should exactly match the inputs passed to the APIs. From a
first glance, it might seem like Cedar is completely untyped, but this is not the case. Cedar enables you to strongly
type all entity types and actions in your domain using a schema file.

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

The syntax of the schema file closely resembles JSON with additional syntax for defining types and actions. For our
example domain, we've declared two entity types, `UserPrincipal` and `Order`, and one action, `ViewOrder`. Because we
need to know who placed the order to evaluate the policy, we've added a `placedBy` attribute to the `Order` type that
references a `UserPrincipal`. Furthermore, the `ViewOrder` action also declares which principal and resource types it
applies to.

You might be curious to know how we can compare a `UserPrincipal` with `Order.placedBy` if we don't have any properties
on the `UserPrincipal` type. This is because Cedar enforces that all entities have a unique entity ID, which is used to
do identity comparison. This ID is implicit, and you don't need to declare it in the schema file.

The context attribute in the action definition is used to pass additional information to the policy evaluation. This
could be used to pass information about the request, such as the IP address of the client making the request, or the
date. The context is a map of arbitrary values that can also be used in the policy conditions. If we wanted to require
the request to come from a specific IP address, we could add a condition to the policy like so:

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

We have now covered the basics of the Cedar policy language and its schema validation. In the next section, we'll look
at how we can use Cedar from userland in a Rust application. We'll write a simple program that evaluates a policy
against a request, and we'll see how we can use the Cedar runtime to do this.

## Cedar from userland with Rust

I will now demonstrate how easy it is to use Cedar from Rust. We will continue to use the example domain where we have
users who can place orders and view pizza orders. For this example, I'll assume you are already familiar with Rust,
and that you have a working Rust environment with Cargo set up. We'll start by initializing a new Rust project, and
adding the necessary dependencies.

```sh
cargo init --bin cedar-example && cd cedar-example
cargo add cedar-policy
```

Next, we'll write some Rust code to declare the different domain types for our application. We'll declare two types, a
`User` struct, and an `Order` struct. We'll also declare an `Action` enum that represents the different actions that
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
we don't necessarily care for the user's name, or how many pizzas were ordered when evaluating the policy. Remember that
the Cedar types should be the bare minimum required to make authorization decisions. It's up to you to decide how much
information you need to pass to the policy evaluation, and you should remember that the more information you pass, the
more complex your types and policies become. Furthermore, you can always add more information to a specific action using
the context attribute as discussed earlier.

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
unique ID of an entity. You might wonder how we are supposed to provide the additional properties for our entity types
if the signature only takes the unique ID. These IDs are only used to identify the correct entity, as Cedar accepts a
set of complete [`cedar_policy::Entity`][docsrs-entity] objects to the policy evaluation.

The principal, action, and resource scopes are optional, as it's not always the case that you have or need all of them.
Perhaps, some are insignificant for the policy evaluation, or perhaps you're evaluating a policy that doesn't require
a resource, such as creating a new resource, or validating an incoming IP address. The context map is a map of arbitrary
values that can be used in the conditions as previously discussed.

The schema is optional, but highly recommended, as it can be used to validate policies at build time like we discussed
earlier. In cases where you do not want to do policy validation, you can pass `None` to the schema argument.

The next step is to map our domain types to Cedar entities, as these are the types that will be used in the policy
evaluation. The Cedar API is not generic over types, but instead requires everything to be of the concrete `Entity`
type. As such, we will  provide `From<&User>` and `From<&Order>` implementations, and `From<Action>` for the `Entity`
type.

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
`id_to_entity_id` function is a helper function that constructs a unique entity ID from an integer ID and a type.

The `Entity` constructor takes three arguments, the unique ID of the entity, a map of attributes, and a set of parent
entities. The attributes map is used to store the properties of the entity that we defined in our schema. Parents are
a more advanced feature I won't cover in this post, but they can be used to define hierarchal relationships between
entities. For example, a `Principal` entity could, for example, be either `UserPrincipal` or `MachinePrincipal`.

In our schema we've defined User without any attributes, and as such, we're leaving an empty HashMap for the attributes,
while Order receives a placedBy attribute that is a reference to a User entity. As Cedar has its own defined data types,
it uses a [`RestrictedExpression`][docsrs-resexp] type to represent any legal values that can be stored inside either an
attribute map or context. In this case, we're using the `new_entity_uid` constructor to store a reference to another
entity.

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

We can now include the policies in our Rust program. Ideally you would load the policies and schema from a file, but for
the sake of simplicity, we will include them as string literals into the compiled binary.

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

Running our program with cargo should exit successfully, as all the assertions pass. We've now successfully implemented
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

The command line tool can be used to validate the policies, format policy files, authorize policies, and more. It's most
definitely a must-have tool for anybody working with Cedar policies. Below is an example of how I validated the policy
from our example scenario.

```sh
$ cedar validate -p src/policy.cedar -s src/policy.cedarschema --schema-format human
  ☞ policy set validation passed
  ╰─▶ no errors or warnings
```

## Conclusion

Cedar is a powerful policy framework that can be used to implement complex authorization rules with great developer
tooling. It might not be as well adopted as Casbin or OPA, but it's a great choice for Rust developers who want to
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
[source]: https://github.com/junlarsen/website/blob/main/src/content/authorization-with-cedar/src/main.rs
