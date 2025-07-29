import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  phoneNumber: string;
  countryCode: string;
  code: string;
  bookingData: {
    barberId: string;
    services: string[];
    bookingDate: string;
    bookingTime: string;
    totalPrice: number;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, countryCode, code, bookingData }: VerifyCodeRequest = await req.json();

    if (!phoneNumber || !countryCode || !code || !bookingData) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find valid verification code
    const { data: verificationData, error: verificationError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('country_code', countryCode)
      .eq('code', code)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (verificationError) {
      console.error("Database error:", verificationError);
      return new Response(
        JSON.stringify({ error: "Failed to verify code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!verificationData || verificationData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification code" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark verification code as used
    const { error: updateError } = await supabase
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', verificationData[0].id);

    if (updateError) {
      console.error("Failed to update verification code:", updateError);
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        phone_number: phoneNumber,
        country_code: countryCode,
        barber_id: bookingData.barberId,
        services: bookingData.services,
        booking_date: bookingData.bookingDate,
        booking_time: bookingData.bookingTime,
        total_price: bookingData.totalPrice,
        is_verified: true,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking creation error:", bookingError);
      return new Response(
        JSON.stringify({ error: "Failed to create booking" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Clean up expired verification codes
    await supabase.rpc('cleanup_expired_verification_codes');

    console.log("Booking created successfully:", booking.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Booking confirmed successfully",
        booking: booking
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);