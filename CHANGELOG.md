# Log of changes for QuotationBook

## [1.0.0] - 2026-05-20
### Added
- Initial project structure.
- Backend API on Node.js (Express) for random quotes.
- Database integration using PostgreSQL 15.
- Web-server setup using Nginx as a reverse proxy.
- Frontend page in 'Gazpromneft' corporate style.
- Docker Compose orchestration for all services.
- Git repository initialization and .gitignore.
- Project documentation (README.md).

### Changed
- Updated quotes from placeholder text to genuine philosophical poetry by Omar Khayyam.

### Fixed
- Fixed critical syntax errors in `index.js` (removed accidental surrounding quotes).
- Fixed HTML structure in `index.html` (resolved issues with escaped quotes and incorrect `</div>` closing tags).
- Fixed Docker Compose command compatibility (transition from `docker-compose` to `docker compose`).