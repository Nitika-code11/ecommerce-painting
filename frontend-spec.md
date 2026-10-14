# Frontend Specification --- Painting E-commerce

**Version:** 2.0\
**Status:** MVP specification\
**Stack:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React
Router, Fetch API or Axios

## 1. Purpose

Build a responsive frontend for the Painting E-commerce catalogue. The
MVP supports browsing paintings, searching by title, viewing details,
and create/edit/delete screens when those backend operations are
enabled.

The frontend is a separate application from the Spring Boot backend.

## 2. Scope

### Included

-   Browse the painting catalogue and search by title.
-   View a painting's details.
-   Create, edit, and delete painting records if supported by the
    running backend.
-   Call the Spring Boot REST API.
-   Handle loading, empty, success, not-found, invalid-data, and error
    states.
-   Validate form fields for usability.
-   Validate API response data at runtime before trusting its shape.
-   Responsive and accessible UI.

### Not included in this MVP

-   Authentication or user accounts.
-   Cart, checkout, orders, payments, shipping, reviews, or wishlist.
-   Binary image uploads; `imageUrl` is an optional URL/string.

## 3. Technology responsibilities

  -----------------------------------------------------------------------
  Technology                          Responsibility
  ----------------------------------- -----------------------------------
  React                               UI components and rendering

  TypeScript                          Static type checking

  Vite                                Development server and production
                                      build

  Tailwind CSS                        Styling and responsive layout

  shadcn/ui                           Customizable buttons, dialogs, form
                                      controls, and other UI components

  React Router                        Client-side page navigation

  Fetch API or Axios                  HTTP communication with backend

  Vitest and React Testing Library    Frontend tests
  -----------------------------------------------------------------------

Use either Fetch or Axios consistently. Fetch is sufficient for the MVP;
installing both is unnecessary.

## 4. Routes

  -----------------------------------------------------------------------
  Route                   Screen                  Behaviour
  ----------------------- ----------------------- -----------------------
  `/paintings`            Catalogue               Fetch paintings and
                                                  support title search

  `/paintings/new`        Create painting         Validated form; submit
                                                  POST

  `/paintings/:id`        Details                 Fetch and display one
                                                  painting

  `/paintings/:id/edit`   Edit painting           Fetch current record
                                                  and submit PUT

  `*`                     Not found               Friendly not-found page
  -----------------------------------------------------------------------

Hide create/edit/delete controls if those operations are not enabled in
the target environment.

## 5. Data contract

``` typescript
export interface Painting {
  id: number;
  title: string;
  artist: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
}

export interface PaintingInput {
  title: string;
  artist: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
}
```

TypeScript interfaces help catch mistakes in frontend code, but **they
do not validate JSON at runtime**. Treat `response.json()` data as
`unknown` and validate it before using it as a `Painting`.

Example type guard:

``` typescript
export function isPainting(data: unknown): data is Painting {
  if (typeof data !== "object" || data === null) return false;

  const value = data as Record<string, unknown>;

  return (
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    typeof value.artist === "string" &&
    typeof value.price === "number" &&
    typeof value.stock === "number" &&
    (value.description === undefined ||
      value.description === null ||
      typeof value.description === "string") &&
    (value.imageUrl === undefined ||
      value.imageUrl === null ||
      typeof value.imageUrl === "string")
  );
}
```

Create a validator for arrays of paintings too. Do not cast unchecked
JSON directly to `Painting`. A schema library such as Zod is an optional
future alternative.

## 6. API integration

Configure the backend base URL through an environment variable, for
example:

``` text
VITE_API_BASE_URL=http://localhost:8080
```

Expected endpoints (verify the actual implementation's response shape
and status codes):

  Method   Endpoint                        Purpose
  -------- ------------------------------- ------------------
  GET      `/api/paintings`                List paintings
  GET      `/api/paintings?title=Sunset`   Search by title
  GET      `/api/paintings/{id}`           Get one painting
  POST     `/api/paintings`                Create painting
  PUT      `/api/paintings/{id}`           Update painting
  DELETE   `/api/paintings/{id}`           Delete painting

Agree whether the list endpoint returns a raw array or a wrapper object,
then validate that exact contract.

HTTP client requirements: - Check `response.ok`; Fetch does not reject
merely because the server returns HTTP 4xx/5xx. - Handle network
failures, non-success status codes, and invalid response data. - Parse
JSON only when appropriate. - Keep API calls in a dedicated module
rather than scattering them through components. - Display safe,
human-readable errors without stack traces or internal server details. -
Never put credentials or secrets in `VITE_` environment variables; these
values can be exposed in the client bundle.

## 7. Form validation

-   `title`: required and non-empty after trimming.
-   `artist`: required and non-empty after trimming.
-   `price`: numeric and non-negative; make it strictly positive if that
    is the agreed business rule.
-   `stock`: integer and non-negative.
-   `description`: optional.
-   `imageUrl`: optional; validate URL format when supplied.

Frontend validation improves usability but does not replace backend
validation.

## 8. UI states and accessibility

Every data-driven page should handle loading, success, empty results,
errors, not-found records, and invalid API responses. Forms should show
submission progress and prevent accidental duplicate submissions. After
a successful mutation, update the UI or navigate appropriately and show
confirmation.

Use semantic headings, labels, and buttons; support keyboard navigation
and visible focus; associate validation messages with inputs; do not
communicate status using colour alone. Confirm destructive actions
before deleting.

Use a responsive painting-card grid. Show title, artist, price, and
image where available, with a fallback for missing or broken images.

## 9. Suggested project structure

``` text
src/
  app/
    App.tsx
    router.tsx
  components/
    PaintingCard.tsx
    PaintingForm.tsx
    LoadingState.tsx
    ErrorState.tsx
    EmptyState.tsx
  pages/
    PaintingListPage.tsx
    PaintingDetailsPage.tsx
    CreatePaintingPage.tsx
    EditPaintingPage.tsx
    NotFoundPage.tsx
  api/
    http.ts
    paintingsApi.ts
  types/
    painting.ts
  validation/
    paintingValidation.ts
  main.tsx
```

Adapt this structure to the actual project; avoid unnecessary
abstraction.

## 10. Setup

Use a supported Node.js LTS release. Typical Vite setup:

``` bash
npm create vite@latest painting-store-ui -- --template react-ts
cd painting-store-ui
npm install
npm run dev
```

Install Tailwind CSS, shadcn/ui, React Router, and test dependencies
using the current official instructions for the chosen versions.

Example `.env.local`:

``` text
VITE_API_BASE_URL=http://localhost:8080
```

## 11. Testing

-   Test cards and page states.
-   Test form validation and submission.
-   Test API success, HTTP errors, network errors, and invalid data.
-   Test search and navigation.
-   Test that invalid runtime data is not treated as a valid `Painting`.
-   Test keyboard operation of essential controls.

## 12. Definition of done

-   Catalogue loads from the backend.
-   Title search follows the backend contract.
-   Details page handles valid and unknown IDs.
-   Mutation UI matches the operations actually supported.
-   Loading, empty, and error states are implemented.
-   API responses are validated at runtime before being trusted.
-   Forms are accessible and validate input.
-   Tests pass and the production build succeeds.
-   Setup instructions and environment variables are documented.

## 13. Decisions to confirm

-   Whether list API returns an array or wrapper object.
-   Whether `description` and `imageUrl` can be null.
-   Whether price may be zero.
-   Whether create/update/delete are enabled for intended users.
-   Whether backend CORS allows the frontend development origin.
