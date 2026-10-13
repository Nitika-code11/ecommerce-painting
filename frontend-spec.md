# Frontend Specification — Painting E-commerce

## 1. Purpose

Build a responsive React web application for browsing and managing a catalogue of paintings. The frontend will consume the existing Spring Boot REST API.

This specification describes the current catalogue MVP. Features not supported by the current backend must not be presented as implemented.

## 2. Technology

- React with Vite
- JavaScript (ES modules)
- React Router for client-side navigation
- Fetch API or Axios for HTTP requests
- CSS modules, plain CSS, or another consistent styling approach
- Vitest and React Testing Library for frontend tests

Choose one HTTP client and one styling approach; do not add unnecessary libraries.

## 3. Backend Integration

- API base URL: `http://localhost:8080/api`
- Configure the URL through `VITE_API_BASE_URL`.
- The frontend must call the backend; do not hardcode catalogue data as the real data source.
- Send JSON requests with `Content-Type: application/json` when a request has a JSON body.
- Handle network failures, non-2xx responses, empty results, and malformed or missing image URLs.
- If frontend and backend run on different ports, configure backend CORS for the local frontend origin. Do not use a wildcard origin with credentials in production.

Example `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 4. Pages and Routes

### 4.1 Catalogue — `/`

- Fetch paintings using `GET /paintings`.
- Display a responsive grid of painting cards.
- Each card displays image, title, artist, price, and stock/availability.
- Include a title-search field.
- Submit searches using `GET /paintings?title={searchTerm}`.
- Provide a clear-search action.
- Display loading, empty-results, and error states.
- Clicking a card opens `/paintings/:id`.

### 4.2 Painting Details — `/paintings/:id`

- Fetch a painting using `GET /paintings/{id}`.
- Display title, artist, description, price, stock, and image when available.
- Provide a link back to the catalogue.
- Show a not-found state for a 404 response.
- Show a retry option for recoverable network/server failures.

### 4.3 Admin Catalogue — `/admin/paintings`

- Fetch and display paintings.
- Provide links/actions to add, edit, and delete paintings.
- Ask for confirmation before deletion.
- Refresh the list after a successful create, update, or delete.
- Show success and error feedback.

**Security note:** The current backend has no authentication or authorization. These admin routes are only a development/demo interface and must not be treated as secure. Before public deployment, protect write operations with backend authentication and admin authorization.

### 4.4 Add Painting — `/admin/paintings/new`

Provide a form with:
- `title` — required, max 150 characters
- `artist` — required, max 120 characters
- `description` — optional, max 2,000 characters
- `price` — required, greater than 0
- `stock` — required, integer greater than or equal to 0
- `imageUrl` — optional, max 1,000 characters

Submit with `POST /paintings`. On success, show confirmation and navigate to the catalogue or details page.

### 4.5 Edit Painting — `/admin/paintings/:id/edit`

- Load the current record using `GET /paintings/{id}`.
- Populate the form with existing values.
- Submit changes using `PUT /paintings/{id}`.
- Show validation and server errors without silently discarding the user's input.

## 5. API Contract Used by the Frontend

Base URL: `http://localhost:8080/api`

| User action | Method and endpoint | Expected success |
|---|---|---|
| List all paintings | `GET /paintings` | `200 OK`, JSON array |
| Search by title | `GET /paintings?title=sunset` | `200 OK`, JSON array |
| View a painting | `GET /paintings/{id}` | `200 OK`, JSON object |
| Create a painting | `POST /paintings` | `201 Created`, JSON object |
| Update a painting | `PUT /paintings/{id}` | `200 OK`, JSON object |
| Delete a painting | `DELETE /paintings/{id}` | `204 No Content` |

Example create/update request:

```json
{
  "title": "Sunset Over Hills",
  "artist": "A. Sharma",
  "description": "Acrylic on canvas",
  "price": 4500.00,
  "stock": 3,
  "imageUrl": "https://example.com/sunset.jpg"
}
```

Example response shape:

```json
{
  "id": 1,
  "title": "Sunset Over Hills",
  "artist": "A. Sharma",
  "description": "Acrylic on canvas",
  "price": 4500.00,
  "stock": 3,
  "imageUrl": "https://example.com/sunset.jpg"
}
```

The response shape reflects the current `Painting` entity. If DTOs are introduced later, update this contract and the frontend together.

## 6. Validation and Error Handling

- Validate required fields and field lengths before submission for user feedback.
- Treat backend validation as authoritative.
- Handle `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`, and network errors.
- Do not assume all error responses have the same JSON structure.
- For delete, handle the `204 No Content` response without trying to parse a JSON body.
- Prevent duplicate submissions while a request is in progress.
- Never show a success message before the API confirms success.

## 7. UI and Accessibility

- Use a clean art-gallery visual style; keep focus on artwork imagery.
- Use responsive layouts for mobile, tablet, and desktop.
- Preserve image proportions; provide a fallback if an image fails to load.
- Use semantic HTML, visible focus states, labels for form controls, and keyboard-accessible actions.
- Ensure text and controls have sufficient contrast.
- Display currency consistently. The initial demo may use INR (₹), unless a later requirement specifies another currency.
- Do not add cart, checkout, payment, customer login, or order-history UI until the corresponding backend features exist.

## 8. Suggested Folder Structure

```text
frontend/
├── src/
│   ├── api/
│   │   └── paintingsApi.js
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── PaintingCard.jsx
│   │   ├── PaintingForm.jsx
│   │   ├── LoadingState.jsx
│   │   └── ErrorMessage.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── PaintingDetailsPage.jsx
│   │   ├── AdminPaintingsPage.jsx
│   │   ├── AddPaintingPage.jsx
│   │   └── EditPaintingPage.jsx
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
└── README.md
```

## 9. Testing

- Test catalogue rendering and loading/empty/error states.
- Test title search and clear-search behavior.
- Test painting details for success and not-found cases.
- Test form validation and successful/failed submissions.
- Test delete confirmation and handling of `204 No Content`.
- Mock API calls for unit/component tests; perform at least one integration check against a running backend.

## 10. Acceptance Criteria

1. Catalogue data comes from the Spring Boot API.
2. Title search uses the backend search endpoint.
3. Details page loads the selected painting by ID.
4. Add, edit, and delete flows work against the existing API.
5. Loading, empty, validation, not-found, and error states are handled.
6. UI is responsive and accessible.
7. The base API URL is configurable through an environment variable.
8. Setup and run commands are documented.
9. Tests pass and the production build succeeds.
10. The UI does not claim unsupported features are available.
