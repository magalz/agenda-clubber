# Edge Case Hunter Findings — Story 1.2

```json
[
  {
    "location": "src/middleware.ts:9-10",
    "trigger_condition": "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are undefined",
    "guard_snippet": "if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) throw new Error('Missing env vars');",
    "potential_consequence": "Middleware crashes on all requests when environment variables are missing"
  },
  {
    "location": "src/middleware.ts:31",
    "trigger_condition": "supabase.auth.getUser() returns a null data object or a top-level error",
    "guard_snippet": "const { data: { user } = { user: null }, error } = await supabase.auth.getUser();",
    "potential_consequence": "Destructuring failure or silent auth bypass if getUser call fails"
  },
  {
    "location": "src/middleware.ts:51",
    "trigger_condition": "Profile database query fails due to network or service outage",
    "guard_snippet": "const { data: profile, error } = await query; if (error) return NextResponse.redirect(new URL('/dashboard', request.url));",
    "potential_consequence": "Intermittent DB failures could block admins or leak exceptions into response"
  },
  {
    "location": "src/features/auth/actions.ts:21",
    "trigger_condition": "formData.get('email') returns a File object instead of a string",
    "guard_snippet": "const emailRaw = formData.get('email'); if (typeof emailRaw !== 'string') return { error: { message: 'Invalid input', code: 'TYPE_ERROR' } };",
    "potential_consequence": "Runtime error when calling .trim() or .toLowerCase() on a File object"
  },
  {
    "location": "src/features/auth/actions.ts:63",
    "trigger_condition": "Supabase signOut operation fails on the server-side",
    "guard_snippet": "const { error } = await supabase.auth.signOut(); if (error) console.error('Sign out error', error);",
    "potential_consequence": "Stale session remains in Supabase backend despite client-side logout redirect"
  }
]
```
