import { serve } from '@supabase/functions-js'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitationId } = await req.json()
    
    // Create a Supabase client with the service_role key
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL ?? '',
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    )

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const childId = user.id;

    // 1. Get parent_id from invitation
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('parent_invitations')
      .select('parent_id, status')
      .eq('id', invitationId)
      .single();

    if (fetchError) throw fetchError;
    if (!invitation) throw new Error('Invitation not found or already used.');
    if (invitation.status !== 'pending') throw new Error('Invitation is no longer valid.');

    const { parent_id } = invitation;

    // 2. Update invitation status to 'accepted'
    const { error: updateError } = await supabaseAdmin
      .from('parent_invitations')
      .update({ status: 'accepted', child_id: childId })
      .eq('id', invitationId);

    if (updateError) throw updateError;

    // 3. Create the link in parent_child_link table
    const { error: linkError } = await supabaseAdmin
      .from('parent_child_link')
      .insert({ parent_id, child_id: childId });

    if (linkError) throw linkError;

    return new Response(JSON.stringify({ message: 'Invitation accepted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
