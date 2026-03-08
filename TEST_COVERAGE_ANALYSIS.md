# Test Coverage Analysis

## Current State

The codebase has **zero test coverage**. There are no test files, no testing framework installed, and no test configuration. The `package.json` contains no test script and no testing dependencies (no Jest, Vitest, React Testing Library, Playwright, etc.).

---

## Recommended Testing Framework Setup

For a Next.js 16 + React 19 project, the recommended stack is:

- **Vitest** — fast unit/integration test runner with native TypeScript and ESM support
- **@testing-library/react** — component testing
- **msw (Mock Service Worker)** — mocking Supabase API calls and email services
- **Playwright** — end-to-end tests (optional, for critical user flows)

---

## Priority Areas for Test Coverage

### Priority 1: Pure Utility Functions (High value, low effort)

These are the easiest to test — no mocking needed, pure input/output.

#### `src/lib/utils/format.ts`
| Function | What to test |
|---|---|
| `formatDate()` | German locale output, string vs Date input |
| `formatDateShort()` | Short format correctness |
| `formatDateRange()` | Same-month optimization vs cross-month rendering |
| `formatDateTime()` | Time component included correctly |
| `formatCurrency()` | EUR formatting, decimals, thousands separators |
| `formatFileSize()` | Boundary values: 0 B, 1023 B, 1024 B (=1 KB), 1 MB edge |

#### `src/lib/email/templates.ts` — `formatEuro()` helper
Same as `formatCurrency` but duplicated — test independently.

**Example tests:**
```ts
expect(formatCurrency(1234.5)).toBe("1.234,50 €");
expect(formatFileSize(0)).toBe("0 B");
expect(formatFileSize(1024)).toBe("1 KB");
expect(formatFileSize(1536 * 1024)).toBe("1.5 MB");
expect(formatDateRange("2025-07-10", "2025-07-17")).toContain("10. - 17. Juli 2025");
expect(formatDateRange("2025-06-28", "2025-07-05")).toContain("Juni");
```

---

### Priority 2: Validation Schemas (High value, low effort)

#### `src/lib/validations/booking.ts` — `bookingFormSchema` and `guestSchema`

| Scenario | Expected |
|---|---|
| Valid complete booking | Passes |
| Missing `contact_first_name` | Fails with error |
| Invalid email format | Fails with "Bitte gueltige E-Mail-Adresse eingeben" |
| Invalid UUID for `event_id` | Fails |
| Empty `guests` array | Fails with "Mindestens ein Gast erforderlich" |
| Guest with missing `first_name` | Fails |
| Guest with optional fields omitted | Passes |
| `is_child` defaults to `false` | Passes |

#### `src/lib/actions/waitlist.ts` — `waitlistSchema`

| Scenario | Expected |
|---|---|
| Valid waitlist entry | Passes |
| `guest_count` of 0 | Fails |
| `guest_count` of 11 | Fails |
| Missing email | Fails |

---

### Priority 3: Email Templates (Medium value, low effort)

#### `src/lib/email/templates.ts`

All four template functions are pure functions that take data and return `{ subject, html }`. They can be tested without mocking.

| Function | What to test |
|---|---|
| `reservationConfirmationEmail()` | Subject includes house type name; HTML contains first name, IBAN, payment reference, formatted price, confirmation URL, expiry date |
| `bookingConfirmedEmail()` | Subject says "Zahlung bestaetigt"; HTML contains house label and price |
| `paymentReminderEmail()` | Subject contains formatted expiry date; HTML contains payment details |
| `reservationExpiredEmail()` | Subject contains house type; HTML informs about expiration |

**Why this matters:** Email templates are user-facing and bugs here (wrong payment reference, missing IBAN) cause real financial confusion.

---

### Priority 4: Server Actions — Business Logic (High value, medium effort)

These require mocking Supabase and the email service.

#### `src/lib/actions/booking.ts` — `createReservation()`

| Scenario | Expected |
|---|---|
| Invalid form data | Returns `{ error: "Ungueltige Eingaben..." }` |
| Missing Supabase env vars | Returns environment error |
| Supabase URL contains "dein-projekt" (placeholder) | Returns environment error |
| RPC returns error | Returns error with message |
| RPC returns result without `id` | Returns error |
| Successful creation | Calls `redirect()` with correct URL, sends email asynchronously |

#### `src/lib/actions/admin.ts`

| Function | Key scenarios |
|---|---|
| `confirmPayment()` | Auth check runs; DB update sets correct fields (`status: "bestaetigt"`, `payment_status: "eingegangen"`); sends confirmation email; revalidates paths |
| `cancelReservation()` | Auth check runs; sets `status: "storniert"`; releases house (`is_available: true`); revalidates paths |
| `extendReservation()` | Auth check runs; calculates new expiry correctly (adds N days); handles missing reservation |
| `updateAdminNotes()` | Auth check runs; updates notes field |
| `updateEventSettings()` | Auth check runs; passes data through to DB |
| `removeFromWaitlist()` | Auth check runs; deletes correct entry |

#### `src/lib/actions/waitlist.ts` — `joinWaitlist()`

| Scenario | Expected |
|---|---|
| Invalid form data | Returns validation error |
| Missing env vars | Returns environment error |
| RPC error | Returns error message |
| RPC returns no position | Returns error |
| Success | Redirects to waitlist page with position |

---

### Priority 5: Cron Job / API Route (High value, medium effort)

#### `src/app/api/cron/expire-reservations/route.ts`

This is critical infrastructure that runs unattended every 30 minutes.

| Scenario | Expected |
|---|---|
| Missing/wrong `CRON_SECRET` | Returns 401 |
| No expired reservations | Returns `{ expired: 0, reminders: 0 }` |
| Expired reservation found | Updates status to "abgelaufen", releases house, sends expiry email |
| Reservation expiring within 3 days (no prior reminder) | Sends reminder email, sets `[reminder-sent]` flag |
| Reservation with `[reminder-sent]` flag | Skips sending duplicate reminder |

**Why this matters:** Bugs in this route silently cause reservations to never expire (blocking houses permanently) or spam users with duplicate reminder emails.

---

### Priority 6: Middleware & Auth (Medium value, higher effort)

#### `src/middleware.ts`

| Scenario | Expected |
|---|---|
| Unauthenticated user hits `/admin/*` | Redirected to `/login` with `redirect` param |
| Authenticated non-admin hits `/admin/*` | Redirected to `/login?error=not-authorized` |
| Authenticated admin hits `/admin/*` | Passes through |
| Authenticated admin hits `/login` | Redirected to `/admin` |
| Unauthenticated user hits `/login` | Passes through |

#### `src/lib/auth/admin.ts` — `requireAdminAccess()`

| Scenario | Expected |
|---|---|
| No user session | Redirects to `/login` |
| User exists but `is_admin` RPC fails | Signs out, redirects with error |
| User exists but not admin | Signs out, redirects with error |
| User is admin | Returns user object |

---

### Priority 7: Component Tests (Medium value, higher effort)

#### `src/components/booking/booking-form.tsx`

- Form renders all fields (contact info, house type selection, guest list)
- Adding/removing guests works
- Validation errors display on submit with empty required fields
- Successful submission calls `createReservation` action

#### `src/components/admin/reservation-actions.tsx`

- Confirm payment button triggers `confirmPayment()`
- Cancel button shows confirmation dialog
- Extend reservation works with day selector

---

## Suggested Implementation Order

1. **Set up Vitest** with TypeScript support and path aliases
2. **Format utilities** — quick wins, build confidence in the setup
3. **Validation schemas** — critical data integrity
4. **Email templates** — pure functions, user-facing impact
5. **Server actions** — core business logic with Supabase mocks
6. **Cron route** — unattended infrastructure
7. **Middleware/auth** — security boundaries
8. **Component tests** — UI interactions

## Notable Gaps and Risks

| Risk | Impact | Current coverage |
|---|---|---|
| Booking validation bypassed | Invalid data in DB, broken reservations | None |
| Email template renders wrong IBAN/price | Financial confusion for users | None |
| Cron job fails silently | Houses never released, users never notified | None |
| Admin auth bypass | Unauthorized access to all reservations/data | None |
| `extendReservation` date math bug | Wrong expiry dates | None |
| `formatDateRange` cross-month/year edge cases | Wrong dates displayed on homepage | None |
| Duplicate payment reminders | Users spammed with emails | None |
