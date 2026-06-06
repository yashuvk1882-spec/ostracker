# Firestore Security Specification & Threat Model

This document outlines the attribute-based access control (ABAC) architecture and threat-prevention model for the Daily Life & Study Hub application.

## 1. Core Data Invariants

1. **User Ownership (Boundary Lock)**: Any resource stored sub-nested within a `/users/{userId}` structure is strictly accessible only to `request.auth.uid == userId`. No cross-user reads or writes are allowed.
2. **Strict Identity Integrity**: Any field containing user identification (`userId` or similar) must be verified against `request.auth.uid`. No identity spoofing is allowed.
3. **Temporal Validity**: Fields like `createdAt` are immutable after document generation, and `updatedAt` / `createdAt` must match standard server timestamping values (`request.time`).
4. **Id Sanitization**: All documents target identifiers must adhere to specific string structures: alphanumeric characters, hyphens, and underscores only.

---

## 2. The "Dirty Dozen" Threat Payloads

The following payload attempts seek to bypass standard identity, integrity, and temporal barriers. They must always return `PERMISSION_DENIED`:

### Payload 1: Profile Shadow Field Injection (Privilege Escalation)
Attempting to create a profile with a phantom field `isAdmin: true` to bypass administrative safety gates.
```json
{
  "name": "Alex Hacker",
  "calorieGoal": 2200,
  "sleepGoal": 8,
  "studyGoal": 4,
  "waterGoal": 8,
  "isAdmin": true
}
```

### Payload 2: Cross-User Profile Mutation (Identity Spoofing)
User `hacker_123` attempts to overwrite the profile of victim `victim_456` at path `/users/victim_456`.
```json
{
  "name": "Victim Hijacked",
  "calorieGoal": 1000,
  "sleepGoal": 2,
  "studyGoal": 12,
  "waterGoal": 1
}
```

### Payload 3: Orphaned Event Assignment (Relational Escape)
Creating a timetable event where the category is an arbitrarily long malicious string to cause resource exhaustion.
```json
{
  "id": "t10",
  "title": "SQL Injection Revise",
  "category": "malicious_overflow_category_which_is_over_sixty_four_characters_long_attempt",
  "startTime": "09:00",
  "endTime": "11:00",
  "date": "2026-06-06"
}
```

### Payload 4: Invalid Format Timeline Injection (Value Poisoning)
Adding start and end hours that violate standard HH:MM structures or string boundaries.
```json
{
  "id": "t20",
  "title": "Study Block",
  "category": "study",
  "startTime": "twenty-five:ninety",
  "endTime": "99:99",
  "date": "2026-06-06"
}
```

### Payload 5: Past Deadline Creation (Temporal Poison)
Attempting to force list items into the feed with mock timestamps or overriding client timestamps.
```json
{
  "id": "d9",
  "subjectId": "s1",
  "title": "Pre-graded Exam Handin",
  "dueDate": "1999-01-01",
  "completed": true,
  "createdAt": "2000-01-01T00:00:00Z"
}
```

### Payload 6: Workout Goal Resource Exhaustion (Denial of Wallet)
Injecting a 1MB weight number value to crash rendering or exceed system storage metrics on numerical sets.
```json
{
  "id": "w_overflow",
  "title": "Squat session",
  "date": "2026-06-06",
  "durationMinutes": 999999,
  "caloriesBurned": 50000000,
  "exercises": [
    { "id": "ex1", "name": "Power Squat", "sets": [{ "reps": 99999, "weight": 999999999 }] }
  ]
}
```

### Payload 7: Unauthorized Blanket Query Scrape (PII Leak)
Attacking the users path by submitting a blanket read query `db.collection('users').get()` from an arbitrary authenticated client.
**Result Needed**: Deny list/get queries where target sub-resource data ownership is not restricted or checked.

### Payload 8: Immutable Metadata Modification (Immutability Violation)
Updating a completed study session with a brand new `createdAt` stamp or changed identifier key.
```json
{
  "id": "st-new",
  "subjectId": "s1",
  "date": "2026-06-01",
  "durationMinutes": 60,
  "notes": "Attempting to change index"
}
```

### Payload 9: Empty Title Milestone Injection (Schema Deficit)
Creating a deadline without the required `title` property.
```json
{
  "id": "d-empty",
  "subjectId": "s2",
  "dueDate": "2026-06-07",
  "completed": false
}
```

### Payload 10: State Step Bypass on Task Priority (Value Injection)
Updating a focus task's priority with a custom invalid value (e.g., `'giga-high'`) rather than the whitelisted enum selections (`'high' | 'medium' | 'low'`).
```json
{
  "id": "q1",
  "title": "Important revision",
  "priority": "giga-high",
  "completed": false,
  "date": "2026-06-06",
  "category": "study"
}
```

### Payload 11: Cross-User Event Hijack (Identity Spoofing)
Authenticated user `A` tries to update user `B`'s timeline item description.
**Result Needed**: Rejected on path parameter matching (`request.auth.uid == userId`).

### Payload 12: Negative Water Cups Consumption (Anti-State Injection)
Adding a water intake record of `-50` cups to trigger application logic calculation errors.
```json
{
  "cups": -50,
  "date": "2026-06-06"
}
```

---

## 3. Simulated Tests Runner Config

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Hub Fortress Rules Verification', () => {
  let testEnv: any;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'gen-lang-client-0802511355',
      firestore: {
        host: 'localhost',
        port: 8080
      }
    });
  });

  it('blocks anonymous access to user collections', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(db.doc('users/alex').get());
  });

  it('enforces User Ownership boundaries on create', async () => {
    const context = testEnv.authenticatedContext('alex');
    const db = context.firestore();
    
    // Successful self profile creation
    await assertSucceeds(db.doc('users/alex').set({
      name: 'Alex Student',
      waterGoal: 8,
      calorieGoal: 2200,
      sleepGoal: 8,
      studyGoal: 4
    }));

    // Banned cross-profile write
    await assertFails(db.doc('users/another_victim').set({
      name: 'Victim Student',
      waterGoal: 8,
      calorieGoal: 2200,
      sleepGoal: 8,
      studyGoal: 4
    }));
  });
});
```
