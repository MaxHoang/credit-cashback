migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new Field({ name: "owned_cards", type: "json", maxSize: 20000 }));
  users.fields.add(new Field({ name: "picks", type: "json", maxSize: 50000 }));
  users.fields.add(new Field({ name: "default_spend_tier", type: "text", max: 16 }));
  // owner-only access
  users.viewRule = "id = @request.auth.id";
  users.updateRule = "id = @request.auth.id";
  users.listRule = null;   // no listing others
  users.createRule = "";   // allow OAuth-created signups
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId("users");
  ["owned_cards", "picks", "default_spend_tier"].forEach((n) => {
    const f = users.fields.getByName(n); if (f) users.fields.remove(f);
  });
  app.save(users);
});
