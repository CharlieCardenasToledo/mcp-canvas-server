# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.1] — 2026-07-16

### Fixed
- CI workflow: replaced `npm ci` with `npm install` since `package-lock.json` is excluded from version control
- Added TypeScript type-check step (`tsc --noEmit`) to CI
- Fixed broken author link in README.md

### Added
- Link to `README.es.md` (Spanish version) in the English README
- Link to `llms-install.md` in Table of Contents and as a dedicated section

---

## [1.2.0] — 2026-06-01

### Added
- New Quizzes (LTI) support via `/api/quiz/v1` endpoint
- Peer review tools: `list_peer_reviews`, `get_submission_peer_reviews`, `create_peer_review`, `delete_peer_review`
- Calendar and appointment group tools
- Analytics tools: `get_course_analytics`, `get_student_analytics`, `get_course_activity_stream`, `search_course_content`
- Conversation tools for Canvas inbox messaging
- HTTP server mode with Swagger UI (`npm run start:http`)
- Docker and `docker-compose.yml` support
- Render deployment configuration (`render.yaml`)

---

## [1.1.0] — 2026-04-01

### Added
- Rubric tools: `create_rubric`, `update_rubric`, `create_rubric_association`
- Group management: `list_group_categories`, `create_group_category`, `list_groups_in_category`, `create_group`, `assign_unassigned_members`, `add_group_member`
- Enrollment tools: `enroll_user`, `remove_enrollment`, `get_user`, `get_profile`, `search_users`
- Question bank tools
- File management: upload, update, delete, folder CRUD

---

## [1.0.0] — 2026-02-12

### Added
- Initial release
- MCP stdio transport for Claude Desktop and Claude Code
- Course, module, page, assignment, submission, grading, quiz, student, and discussion tools
- Canvas REST API client with token-based authentication
- CLI `config` command for credential setup
- GitHub Actions CI/CD and npm publish workflow
