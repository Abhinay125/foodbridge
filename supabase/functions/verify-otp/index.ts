import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  mobileNumber: string;
  otp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mobileNumber, otp } = await req.json() as VerifyRequest;
    
    if (!mobileNumber || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: 'Mobile number and OTP are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if OTP table exists, if not use dev mode
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('mobile_number', mobileNumber)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .single();

    // Dev mode fallback - check if table doesn't exist
    if (fetchError && fetchError.code === '42P01') {
      // Table doesn't exist - dev mode
      console.log(`[DEV MODE] Verifying OTP for ${mobileNumber}: ${otp}`);
      // In dev mode, accept any 6-digit OTP
      if (otp.length === 6 && /^\d{6}$/.test(otp)) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'OTP verified (dev mode)',
            profileData: { mobileNumber }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid OTP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired OTP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // OTP is valid - delete it (one-time use)
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('mobile_number', mobileNumber)
      .eq('otp', otp);

    // Check if NGO profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', mobileNumber)
      .eq('user_type', 'ngo')
      .eq('is_active', true)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP verified successfully',
        profileData: profile ? { id: profile.id, ...profile } : { mobileNumber }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verify OTP error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});