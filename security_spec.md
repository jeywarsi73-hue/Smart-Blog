# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Unauthenticated & Reader Isolation**: Unauthenticated visitors and non-admin readers can ONLY read articles where `status == 'published'` and read `siteSettings/main`. Draft articles (`status == 'draft'`) and `/admins` PII records are never readable by non-admins.
2. **Admin-Only Publishing**: Only verified admin accounts (bootstrapped owner email with `email_verified == true` or verified record in `/admins/{uid}`) may create, update, or delete articles, update `siteSettings`, or manage `/admins`.
3. **Strict Identity & Immutability**: `authorId` on articles must match `request.auth.uid` on creation and cannot be reassigned on update; `createdAt` is server-timestamped (`request.time`) and immutable.
4. **Volumetric & Type Safety**: Every string field enforces strict `.size()` bounds; IDs match `^[a-zA-Z0-9_\-]+$` (<= 128 chars); shadow/extra fields are rejected via `keys().hasOnly(...)`.
5. **No Client-Delegated List Queries**: `allow list` on `/articles` explicitly checks `resource.data.status == 'published' || isBootstrappedAdmin()` without any `get()` or `exists()` lookups.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Article Create**: Anonymous request writing to `/articles/hack-1`.
2. **Non-Admin Signed-In Article Create**: Verified non-admin user attempting to publish to `/articles/spoof-1`.
3. **Unverified Admin Email Spoof**: User with admin email string but `email_verified: false` attempting admin write.
4. **Draft Enumeration via List**: Unauthenticated client listing `/articles` without filtering `status == 'published'`.
5. **Draft Direct Read**: Unauthenticated client calling `get` on `/articles/draft-secret`.
6. **Shadow Field Injection on Create**: Admin payload including extra ghost key `isSuperFeatured: true`.
7. **Shadow Field Injection on Update**: Admin update payload including undeclared field `viewsOverride: 99999`.
8. **Author ID Spoofing**: Create payload setting `authorId` to another user's UID instead of `request.auth.uid`.
9. **Immutable `createdAt` Tampering**: Update payload attempting to alter `createdAt` or spoof a future `updatedAt`.
10. **ID Poisoning**: Creating `/articles/` with document ID exceeding 128 characters or containing special characters (`$bad$id`).
11. **Oversized Content Payload**: Creating an article with `content.size() > 50000` or `title.size() > 200` (Denial-of-Wallet guard).
12. **Self-Assigned Admin Escalation**: Non-admin user attempting to write `/admins/{theirUid}` with `role: 'admin'`.
