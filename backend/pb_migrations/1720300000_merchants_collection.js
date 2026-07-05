/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const c = new Collection({
    type: "base",
    name: "merchants",
    // public read (frontend searches merchant -> category); no public writes
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "name", type: "text", required: true, max: 200 },
      { name: "mcc", type: "text", max: 8 },
      { name: "category", type: "text", max: 32 },
      { name: "method", type: "text", max: 16 },
    ],
    indexes: [
      "CREATE INDEX `idx_merchants_name` ON `merchants` (`name`)",
      "CREATE INDEX `idx_merchants_mcc` ON `merchants` (`mcc`)",
    ],
  });
  app.save(c);
}, (app) => {
  const c = app.findCollectionByNameOrId("merchants");
  app.delete(c);
});
