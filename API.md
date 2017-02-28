Wotify/Hackdash API guide
=========================

As Hackdash uses Backbone (Marionettejs) a resful-api is available.

Theses are some of the most important endpoints:

Projects:
---------

### `GET /api/v2/projects`

List all projects (paginated)

**URL GET Params** (*?limit=10&page=1*):

- `limit` Number of results per page (defaults to 50 or whatever defined in config.json)
- `page` Number of page (defaults to 0)
- `q` Any text to be search in the *title*, *description*, *tags* or *domain* (dashboard) fields

### `GET /api/v2/{DOMAIN}/projects`

List all projects in a dashboard (not paginated)

**Params**:

- `DOMAIN` A valid dashboard ID

**URL GET Params** (*?q=project*):

- `q` Any text to be search in the *title*, *description*, *tags* or *domain* (dashboard) fields

Users:
------

### `GET /api/v2/users`

List all users (paginated). **ONLY SHOWS users with bio if parameter `q` or `role` is not present**

**URL GET Params** (*?limit=10&page=1*):
- `limit` Number of results per page (defaults to 50 or whatever defined in config.json)
- `page` Number of page (defaults to 0)
- `q` Any text to be search in the *name*, *username* or *email* fields
- `role` Shows users with specified role (if empty or ALL, shows all users, event without bio)

...TODO...
