/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. auxiliary_announcements collection
  const announcements = new Collection({
    name: "auxiliary_announcements",
    type: "base",
    listRule: "active = true",
    viewRule: "active = true",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "message",
        type: "text",
        required: true,
      },
      {
        name: "severity",
        type: "select",
        required: true,
        values: ["info", "warning", "critical"],
      },
      {
        name: "active",
        type: "bool",
        required: true,
      },
    ],
  });
  app.save(announcements);

  // 2. user_ui_preferences collection
  const preferences = new Collection({
    name: "user_ui_preferences",
    type: "base",
    listRule: '@request.auth.id != "" && user_id = @request.auth.id',
    viewRule: '@request.auth.id != "" && user_id = @request.auth.id',
    createRule: '@request.auth.id != "" && user_id = @request.auth.id',
    updateRule: '@request.auth.id != "" && user_id = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user_id = @request.auth.id',
    fields: [
      {
        name: "user_id",
        type: "text",
        required: true,
      },
      {
        name: "density",
        type: "select",
        values: ["compact", "comfortable"],
      },
      {
        name: "pinned_widgets",
        type: "json",
      },
      {
        name: "dismissed_banners",
        type: "json",
      },
    ],
  });
  app.save(preferences);
}, (app) => {
  const announcements = app.findCollectionByNameOrId("auxiliary_announcements");
  if (announcements) app.delete(announcements);

  const preferences = app.findCollectionByNameOrId("user_ui_preferences");
  if (preferences) app.delete(preferences);
});
