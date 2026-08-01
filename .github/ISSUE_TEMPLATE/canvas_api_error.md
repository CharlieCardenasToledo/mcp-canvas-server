---
name: Canvas API error
about: Report a 4xx/5xx error returned by the Canvas REST API
title: "[API] "
labels: api-error
assignees: ""
---

**Tool name**
Which tool triggered the Canvas API error?

**HTTP status code**
e.g. 401, 403, 404, 422, 500

**Canvas error response**

```json
{
  "errors": [...]
}
```

**Endpoint called**
e.g. `PUT /api/v1/courses/:id/assignments/:assignment_id/submissions/:user_id`

**Canvas environment**

- Cloud-hosted or self-hosted?
- Institution domain (redacted if needed):
