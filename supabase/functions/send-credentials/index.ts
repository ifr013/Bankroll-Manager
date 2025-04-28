// @deno-types="npm:@types/node@20.11.5"
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playerId } = await req.json();

    if (!playerId) {
      throw new Error('Player ID is required');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get player details
    const { data: player, error: playerError } = await supabaseClient
      .from('staking_players')
      .select('user_id, email, name')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      // Try CFP players if not found in staking players
      const { data: cfpPlayer, error: cfpError } = await supabaseClient
        .from('cfp_players')
        .select('user_id, email, name')
        .eq('id', playerId)
        .single();

      if (cfpError || !cfpPlayer) {
        throw new Error('Player not found');
      }
      player = cfpPlayer;
    }

    // Get user metadata
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(
      player.user_id
    );

    if (userError || !user) {
      throw new Error('User not found');
    }

    const tempPassword = user.user_metadata?.temp_password;
    if (!tempPassword) {
      throw new Error('No temporary password found');
    }

    // Send email using Supabase's built-in email service
    const { error: emailError } = await supabaseClient.auth.admin.inviteUserByEmail(
      player.email,
      {
        data: {
          name: player.name,
          temp_password: tempPassword,
        },
      }
    );

    if (emailError) throw emailError;

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});