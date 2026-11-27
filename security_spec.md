# Security Specification — Aaditya TG Store Firestore Rules

## 1. Data Invariants
1. **Strict Identity & Email Verification**: Only authenticated users with `request.auth.token.email_verified == true` may read or write their own `/users/{userId}` document (`userId == request.auth.uid`).
2. **PII Isolation**: `/users/{userId}` stores email and display name. Unauthenticated reads and cross-user `get`/`list` queries are strictly forbidden.
3. **Immutable Ownership & Creation Time**: `uid`, `authProvider`, and `createdAt` cannot be modified after creation. `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
4. **No Shadow Fields**: `keys().hasAll(...) && keys().hasOnly(...)` on create and `affectedKeys().hasOnly(['name', 'email', 'updatedAt'])` on update prevent client injection of roles (`isAdmin`, `balance`, etc.).
5. **Path Hardening & Volumetric Bounds**: All document IDs match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), and every string enforces exact length bounds matching `firebase-blueprint.json`.

## 2. Dirty Dozen Payloads (Must All Return `PERMISSION_DENIED`)
1. **Unauthenticated read on `/users/uid123`**: `auth: null` -> Denied.
2. **Cross-user read on `/users/victimUid`**: `auth: { uid: 'attackerUid', token: { email_verified: true } }` -> Denied.
3. **Collection list scraping on `/users`**: `auth: { uid: 'user1', token: { email_verified: true } }` -> Denied (`allow list: if false`).
4. **Unverified email write on `/users/user1`**: `auth: { uid: 'user1', token: { email_verified: false } }` -> Denied.
5. **Identity spoofing (`uid` mismatch in payload)**: `{ uid: 'victimUid', email: 'a@b.com', name: 'A', authProvider: 'google', createdAt: serverTime, updatedAt: serverTime }` written to `/users/user1` -> Denied.
6. **Privilege escalation / Ghost field (`isAdmin: true`)**: `{ uid: 'user1', email: 'a@b.com', name: 'A', authProvider: 'google', isAdmin: true, createdAt: serverTime, updatedAt: serverTime }` -> Denied.
7. **Privilege escalation (`balance: 99999`) on update**: `{ name: 'Hacker', balance: 99999, updatedAt: serverTime }` -> Denied.
8. **Immutable field mutation (`createdAt` changed on update)**: updating `createdAt` or `uid` -> Denied.
9. **Spoofed timestamp (`createdAt: '2020-01-01'`)**: client-supplied string instead of `request.time` -> Denied.
10. **Oversized `name` (> 100 chars) / empty `name`**: `{ name: 'x'.repeat(101), ... }` -> Denied.
11. **Oversized / invalid path ID**: `/users/${'a'.repeat(200)}` or `/users/bad$id` -> Denied.
12. **Admin email spoof without `email_verified`**: `auth: { uid: 'spoof', token: { email: 'aroy327154@gmail.com', email_verified: false } }` reading `/users/otherUid` -> Denied.
