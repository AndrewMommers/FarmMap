// Backs the FarmMap Staff Portal (src/pages/staff/StaffPortalPage.tsx) — the
// one place every staff action (account support fixes, the support-ticket
// queue, client-error diagnostics) goes through. Deliberately NOT expressed
// as RLS policies: staff (e.g. the project owner) are themselves real
// customers who load their own farm via the normal loadFromSupabase bulk
// path, which has no client-side farm_id filter — an RLS bypass on
// farms_read etc. would leak every customer's farm into a staff member's own
// ordinary dashboard. So every action here uses a service_role admin client
// with narrow, explicit queries instead, same shape as invite-user/index.ts.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

// Roles staff (or an owner inviting someone) may assign — never 'owner'.
// Kept in sync with invite-user/index.ts's INVITABLE_ROLES.
const ASSIGNABLE_ROLES = ['manager', 'operator', 'agronomist', 'accountant', 'readonly'];

function uid(): string {
  return crypto.randomUUID();
}

interface StaffRow {
  email: string;
  tier: string;
  is_admin: boolean;
  active: boolean;
}

class StaffPortalError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const body = await req.json();
    const { action } = body;
    if (!action || typeof action !== 'string') return json({ error: 'action is required' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const appBaseUrl = Deno.env.get('APP_BASE_URL');

    const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !caller?.email) return json({ error: 'Not authenticated' }, 401);
    const callerEmail = caller.email.toLowerCase();

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: staffRow } = await admin
      .from('platform_staff').select('email, tier, is_admin, active').eq('email', callerEmail).maybeSingle();
    const staff = staffRow as StaffRow | null;
    if (!staff || !staff.active) return json({ error: 'Not authorized' }, 403);

    const requireAdmin = () => {
      if (!staff.is_admin) throw new StaffPortalError('Administrator permission required', 403);
    };

    const audit = (farmId: string | null, actionName: string, detail?: Record<string, unknown>) =>
      admin.from('staff_audit_log').insert({ staff_email: callerEmail, farm_id: farmId, action: actionName, detail: detail ?? null });

    switch (action) {
      case 'whoami': {
        return json({ isStaff: true, tier: staff.tier, isAdmin: staff.is_admin });
      }

      case 'search_farms': {
        const query = String(body.query ?? '').trim();

        // No query yet: give staff something to browse rather than a blank
        // screen — most recently created farms, same idea as an admin
        // panel's default unfiltered list.
        if (!query) {
          const { data: recent, error: recentErr } = await admin
            .from('farms').select('id, name, owner, region').order('created_at', { ascending: false }).limit(20);
          if (recentErr) throw recentErr;
          return json({
            results: (recent ?? []).map((f) => ({ farmId: f.id, farmName: f.name, owner: f.owner, region: f.region, matchedVia: 'recently created' })),
          });
        }

        const like = `%${query}%`;

        const [byFarm, byUser] = await Promise.all([
          admin.from('farms').select('id, name, owner, region').or(`name.ilike.${like},owner.ilike.${like}`).limit(20),
          admin.from('farm_users').select('farm_id, name, email').or(`email.ilike.${like},name.ilike.${like}`).limit(20),
        ]);
        if (byFarm.error) throw byFarm.error;
        if (byUser.error) throw byUser.error;

        const farmIds = Array.from(new Set([...(byFarm.data ?? []).map((f) => f.id), ...(byUser.data ?? []).map((u) => u.farm_id)]));
        if (farmIds.length === 0) return json({ results: [] });

        const { data: farms, error: farmsErr } = await admin.from('farms').select('id, name, owner, region').in('id', farmIds);
        if (farmsErr) throw farmsErr;

        const matchedViaUser = new Map((byUser.data ?? []).map((u) => [u.farm_id, u.email]));
        const results = (farms ?? []).map((f) => ({
          farmId: f.id, farmName: f.name, owner: f.owner, region: f.region,
          matchedVia: matchedViaUser.has(f.id) ? `team member ${matchedViaUser.get(f.id)}` : 'farm name/owner',
        }));
        return json({ results });
      }

      case 'get_farm_detail': {
        const farmId = String(body.farmId ?? '');
        if (!farmId) return json({ error: 'farmId is required' }, 400);

        const [farmRes, rosterRes, paddocksRes, mobsRes, tasksRes] = await Promise.all([
          admin.from('farms').select('*').eq('id', farmId).single(),
          admin.from('farm_users').select('*').eq('farm_id', farmId).order('created_at', { ascending: true }),
          admin.from('paddocks').select('id', { count: 'exact', head: true }).eq('farm_id', farmId),
          admin.from('livestock_mobs').select('id', { count: 'exact', head: true }).eq('farm_id', farmId),
          admin.from('tasks').select('id', { count: 'exact', head: true }).eq('farm_id', farmId),
        ]);
        if (farmRes.error) return json({ error: 'Farm not found' }, 404);
        if (rosterRes.error) throw rosterRes.error;

        await audit(farmId, 'view_farm');
        return json({
          farm: farmRes.data,
          roster: rosterRes.data,
          counts: { paddocks: paddocksRes.count ?? 0, livestockMobs: mobsRes.count ?? 0, tasks: tasksRes.count ?? 0 },
        });
      }

      case 'resend_invite': {
        const farmUserId = String(body.farmUserId ?? '');
        if (!farmUserId) return json({ error: 'farmUserId is required' }, 400);
        if (!appBaseUrl) return json({ error: 'Server misconfigured: APP_BASE_URL not set' }, 500);

        const { data: row, error: rowErr } = await admin.from('farm_users').select('*').eq('id', farmUserId).single();
        if (rowErr || !row) return json({ error: 'Team member not found' }, 404);
        if (row.user_id) return json({ error: 'This person has already claimed their invite' }, 409);

        const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(row.email, {
          redirectTo: `${appBaseUrl}/accept-invite`,
          data: { invited_name: row.name, farm_id: row.farm_id },
        });
        if (inviteErr) return json({ error: inviteErr.message }, 500);

        await audit(row.farm_id, 'resend_invite', { farmUserId, email: row.email });
        return json({ ok: true });
      }

      case 'toggle_user_active': {
        const farmUserId = String(body.farmUserId ?? '');
        const active = Boolean(body.active);
        if (!farmUserId) return json({ error: 'farmUserId is required' }, 400);

        const { data: row, error } = await admin.from('farm_users').update({ active }).eq('id', farmUserId).select('farm_id').single();
        if (error || !row) return json({ error: error?.message ?? 'Team member not found' }, 404);

        await audit(row.farm_id, 'toggle_user_active', { farmUserId, active });
        return json({ ok: true });
      }

      case 'change_user_role': {
        const farmUserId = String(body.farmUserId ?? '');
        const role = String(body.role ?? '');
        if (!farmUserId) return json({ error: 'farmUserId is required' }, 400);
        if (!ASSIGNABLE_ROLES.includes(role)) {
          return json({ error: `role must be one of: ${ASSIGNABLE_ROLES.join(', ')}` }, 400);
        }

        const { data: row, error } = await admin.from('farm_users').update({ role }).eq('id', farmUserId).select('farm_id').single();
        if (error || !row) return json({ error: error?.message ?? 'Team member not found' }, 404);

        await audit(row.farm_id, 'change_user_role', { farmUserId, role });
        return json({ ok: true });
      }

      case 'add_external_staff': {
        requireAdmin();
        const email = String(body.email ?? '').trim().toLowerCase();
        const name = body.name ? String(body.name) : undefined;
        if (!email) return json({ error: 'email is required' }, 400);

        // Insert-only, not upsert: overwriting an existing row (e.g. someone
        // re-adding an internal admin by mistake) would silently downgrade
        // their tier/admin rights.
        const { data: existing } = await admin.from('platform_staff').select('tier, active').eq('email', email).maybeSingle();
        if (existing) {
          if (existing.active) return json({ error: `${email} is already staff (tier: ${existing.tier})` }, 409);
          const { error: reactivateErr } = await admin.from('platform_staff').update({ active: true }).eq('email', email);
          if (reactivateErr) throw reactivateErr;
        } else {
          const { error: insertErr } = await admin.from('platform_staff')
            .insert({ email, tier: 'external', is_admin: false, active: true, added_by: callerEmail });
          if (insertErr) throw insertErr;
        }

        // Best-effort — a brand-new hire needs a login; an existing account
        // just means inviteUserByEmail errors, which isn't fatal here.
        if (appBaseUrl) {
          await admin.auth.admin.inviteUserByEmail(email, { data: { name } }).catch(() => {});
        }

        await audit(null, 'add_staff', { email, tier: 'external' });
        return json({ ok: true });
      }

      case 'deactivate_staff': {
        requireAdmin();
        const email = String(body.email ?? '').trim().toLowerCase();
        if (!email) return json({ error: 'email is required' }, 400);

        const { error } = await admin.from('platform_staff').update({ active: false }).eq('email', email);
        if (error) throw error;

        await audit(null, 'deactivate_staff', { email });
        return json({ ok: true });
      }

      case 'list_staff': {
        requireAdmin();
        const { data, error } = await admin.from('platform_staff').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        return json({ staff: data });
      }

      case 'list_tickets': {
        const status = body.status ? String(body.status) : undefined;
        const assignedToMe = Boolean(body.assignedToMe);
        let q = admin.from('support_tickets').select('*').order('updated_at', { ascending: false }).limit(100);
        if (status) q = q.eq('status', status);
        if (assignedToMe) q = q.eq('assigned_staff_email', callerEmail);
        const { data: tickets, error } = await q;
        if (error) throw error;

        const farmIds = Array.from(new Set((tickets ?? []).map((t) => t.farm_id)));
        const { data: farms } = farmIds.length
          ? await admin.from('farms').select('id, name, owner').in('id', farmIds)
          : { data: [] };
        const farmById = new Map((farms ?? []).map((f) => [f.id, f]));

        return json({
          tickets: (tickets ?? []).map((t) => ({ ...t, farmName: farmById.get(t.farm_id)?.name, farmOwner: farmById.get(t.farm_id)?.owner })),
        });
      }

      case 'get_ticket': {
        const ticketId = String(body.ticketId ?? '');
        if (!ticketId) return json({ error: 'ticketId is required' }, 400);

        const [ticketRes, messagesRes] = await Promise.all([
          admin.from('support_tickets').select('*').eq('id', ticketId).single(),
          admin.from('support_ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true }),
        ]);
        if (ticketRes.error) return json({ error: 'Ticket not found' }, 404);

        const { data: farm } = await admin.from('farms').select('id, name, owner').eq('id', ticketRes.data.farm_id).single();

        await audit(ticketRes.data.farm_id, 'view_ticket', { ticketId });
        return json({ ticket: ticketRes.data, messages: messagesRes.data ?? [], farm });
      }

      case 'reply_ticket': {
        const ticketId = String(body.ticketId ?? '');
        const message = String(body.message ?? '').trim();
        if (!ticketId || !message) return json({ error: 'ticketId and message are required' }, 400);

        const { data: ticket, error: ticketErr } = await admin.from('support_tickets').select('farm_id, status').eq('id', ticketId).single();
        if (ticketErr || !ticket) return json({ error: 'Ticket not found' }, 404);

        const { error: msgErr } = await admin.from('support_ticket_messages').insert({
          id: uid(), ticket_id: ticketId, author_type: 'staff', author_name: 'FarmMap Support', author_email: callerEmail, message,
        });
        if (msgErr) throw msgErr;

        const nextStatus = ticket.status === 'open' ? 'in_progress' : ticket.status;
        await admin.from('support_tickets').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', ticketId);

        await audit(ticket.farm_id, 'reply_ticket', { ticketId });
        return json({ ok: true });
      }

      case 'update_ticket_status': {
        const ticketId = String(body.ticketId ?? '');
        const status = String(body.status ?? '');
        if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) return json({ error: 'invalid status' }, 400);

        const { data: row, error } = await admin.from('support_tickets')
          .update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId).select('farm_id').single();
        if (error || !row) return json({ error: error?.message ?? 'Ticket not found' }, 404);

        await audit(row.farm_id, 'update_ticket_status', { ticketId, status });
        return json({ ok: true });
      }

      case 'assign_ticket': {
        const ticketId = String(body.ticketId ?? '');
        if (!ticketId) return json({ error: 'ticketId is required' }, 400);

        const { data: row, error } = await admin.from('support_tickets')
          .update({ assigned_staff_email: callerEmail }).eq('id', ticketId).select('farm_id').single();
        if (error || !row) return json({ error: error?.message ?? 'Ticket not found' }, 404);

        await audit(row.farm_id, 'assign_ticket', { ticketId });
        return json({ ok: true });
      }

      case 'get_client_errors': {
        const farmId = String(body.farmId ?? '');
        const limit = Math.min(Number(body.limit) || 25, 100);
        if (!farmId) return json({ error: 'farmId is required' }, 400);

        const { data, error } = await admin.from('client_error_log').select('*')
          .eq('farm_id', farmId).order('created_at', { ascending: false }).limit(limit);
        if (error) throw error;
        return json({ errors: data });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    if (err instanceof StaffPortalError) return json({ error: err.message }, err.status);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
