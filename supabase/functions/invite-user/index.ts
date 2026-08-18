// Called by the logged-in frontend (supabase.functions.invoke) when a farm
// owner invites a teammate from Settings → Users & Access. Verifies the
// caller actually OWNS the farm (not just has RLS-visibility to it — since
// invited members can now SELECT farms too, that alone isn't enough),
// upserts the farm_users row, then sends a real Supabase invite email via
// the admin API (service_role only). Deploy WITH JWT verification (the
// default) — this function must only run for an authenticated request.
//
// The invite email goes through the same Supabase sender used for password
// resets — subject to the same deliverability caveats (rate limits on the
// default sender; configure real SMTP under Project Settings → Auth for
// anything beyond your own testing).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const INVITABLE_ROLES = ['manager', 'operator', 'agronomist', 'accountant', 'readonly'];

function uid(): string {
  return crypto.randomUUID();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const { farmId, email, name, role } = await req.json();
    if (!farmId || typeof farmId !== 'string') return json({ error: 'farmId is required' }, 400);
    if (!email || typeof email !== 'string') return json({ error: 'email is required' }, 400);
    if (!name || typeof name !== 'string') return json({ error: 'name is required' }, 400);
    if (!INVITABLE_ROLES.includes(role)) {
      return json({ error: `role must be one of: ${INVITABLE_ROLES.join(', ')}` }, 400);
    }
    const normalizedEmail = email.trim().toLowerCase();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const appBaseUrl = Deno.env.get('APP_BASE_URL');
    if (!appBaseUrl) return json({ error: 'Server misconfigured: APP_BASE_URL not set' }, 500);

    // Uses the caller's own JWT so we know exactly who's asking.
    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller) return json({ error: 'Not authenticated' }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Explicit ownership check — farms_read now also lets members SELECT a
    // farm they don't own, so RLS-visibility alone can't gate this.
    const { data: farm, error: farmErr } = await admin.from('farms').select('id, user_id').eq('id', farmId).single();
    if (farmErr || !farm) return json({ error: 'Farm not found' }, 404);
    if (farm.user_id !== caller.id) return json({ error: 'Only the farm owner can invite team members' }, 403);

    // Idempotent: re-inviting an existing pending row updates it and resends
    // rather than creating a duplicate; an already-claimed row is a real
    // conflict (that email is already a member here under a real login).
    const { data: existingRows, error: existingErr } = await admin
      .from('farm_users').select('id, user_id').eq('farm_id', farmId).eq('email', normalizedEmail);
    if (existingErr) throw existingErr;
    const existing = existingRows?.[0];
    if (existing?.user_id) {
      return json({ error: 'That email is already an active member of this farm' }, 409);
    }

    const farmUserId = existing?.id ?? uid();
    const { error: upsertErr } = await admin.from('farm_users').upsert({
      id: farmUserId,
      farm_id: farmId,
      name,
      email: normalizedEmail,
      role,
      active: true,
    });
    if (upsertErr) throw upsertErr;

    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${appBaseUrl}/accept-invite`,
      data: { invited_name: name, farm_id: farmId },
    });
    if (inviteErr) {
      // The farm_users row still exists (pending) even if the email failed to
      // send — the owner can see it's stuck and retry, rather than losing
      // the invite silently. inviteUserByEmail also errors here if this
      // email already has ANY Supabase Auth account (not farm-specific) —
      // a case this flow doesn't handle yet (see docs/FEATURES.md).
      return json({ error: inviteErr.message }, 500);
    }

    return json({ ok: true, farmUserId });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
