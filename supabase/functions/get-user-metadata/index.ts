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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
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

    // Get user metadata
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(userId);

    if (userError) throw userError;
    if (!user) throw new Error('User not found');

    // Get or generate temporary password
    let tempPassword = user.user_metadata?.temp_password;
    
    if (!tempPassword) {
      // Generate new password
      tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

      // Update user metadata
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            ...user.user_metadata,
            temp_password: tempPassword
          }
        }
      );

      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({ temp_password: tempPassword }),
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