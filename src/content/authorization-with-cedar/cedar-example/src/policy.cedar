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
