import { createClient } from "npm:@supabase/supabase-js@2";
// =====================================================
// CORS
// =====================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
// =====================================================
// RESPONSE HELPER
// =====================================================
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
// =====================================================
// GET SERVER KEY
// =====================================================
function getServerKey() {
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysRaw) {
    try {
      const secretKeys = JSON.parse(secretKeysRaw);
      if (secretKeys && typeof secretKeys === "object" && typeof secretKeys.default === "string") {
        return secretKeys.default;
      }
    } catch (error) {
      console.error("Unable to parse SUPABASE_SECRET_KEYS:", error);
    }
  }
  // Legacy fallback
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey) {
    return serviceRoleKey;
  }
  throw new Error("Supabase server secret key is not configured.");
}
// =====================================================
// EDGE FUNCTION
// =====================================================
Deno.serve(async (req)=>{
  try {
    // =============================================
    // CORS PREFLIGHT
    // =============================================
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders
      });
    }
    // =============================================
    // ONLY POST
    // =============================================
    if (req.method !== "POST") {
      return jsonResponse({
        success: false,
        error: "Method not allowed."
      }, 405);
    }
    // =============================================
    // SUPABASE URL
    // =============================================
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      return jsonResponse({
        success: false,
        error: "Supabase URL is not configured."
      }, 500);
    }
    // =============================================
    // AUTHORIZATION HEADER
    // =============================================
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({
        success: false,
        error: "Authentication required."
      }, 401);
    }
    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse({
        success: false,
        error: "Invalid authorization header."
      }, 401);
    }
    const accessToken = authorization.substring(7).trim();
    if (!accessToken) {
      return jsonResponse({
        success: false,
        error: "Access token is missing."
      }, 401);
    }
    // =============================================
    // SERVER SUPABASE CLIENT
    // =============================================
    const serverKey = getServerKey();
    const supabase = createClient(supabaseUrl, serverKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    // =============================================
    // VERIFY CALLER
    // =============================================
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData?.user) {
      console.error("Caller authentication failed:", userError);
      return jsonResponse({
        success: false,
        error: "Your login session is invalid or expired."
      }, 401);
    }
    const callerId = userData.user.id;
    // =============================================
    // VERIFY CALLER PROFILE
    // =============================================
    const { data: callerProfile, error: callerProfileError } = await supabase.from("profiles").select("id, role, is_active").eq("id", callerId).maybeSingle();
    if (callerProfileError) {
      console.error("Caller profile lookup failed:", callerProfileError);
      return jsonResponse({
        success: false,
        error: "Unable to verify administrator account."
      }, 500);
    }
    // =============================================
    // ADMIN + ACTIVE CHECK
    // =============================================
    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.is_active !== true) {
      return jsonResponse({
        success: false,
        error: "You are not authorized to delete staff accounts."
      }, 403);
    }
    // =============================================
    // READ REQUEST
    // =============================================
    let body;
    try {
      body = await req.json();
    } catch  {
      return jsonResponse({
        success: false,
        error: "Invalid request body."
      }, 400);
    }
    const targetUserId = typeof body.user_id === "string" ? body.user_id.trim() : "";
    // =============================================
    // VALIDATE TARGET ID
    // =============================================
    if (!targetUserId) {
      return jsonResponse({
        success: false,
        error: "Staff user ID is required."
      }, 400);
    }
    // =============================================
    // PREVENT SELF-DELETION
    // =============================================
    if (targetUserId === callerId) {
      return jsonResponse({
        success: false,
        error: "You cannot delete your own account."
      }, 403);
    }
    // =============================================
    // FIND TARGET PROFILE
    // =============================================
    const { data: targetProfile, error: targetProfileError } = await supabase.from("profiles").select("id, full_name, role, is_active").eq("id", targetUserId).maybeSingle();
    if (targetProfileError) {
      console.error("Target profile lookup failed:", targetProfileError);
      return jsonResponse({
        success: false,
        error: "Unable to find the selected user."
      }, 500);
    }
    if (!targetProfile) {
      return jsonResponse({
        success: false,
        error: "Staff account was not found."
      }, 404);
    }
    // =============================================
    // STAFF ONLY
    // =============================================
    if (targetProfile.role !== "staff") {
      return jsonResponse({
        success: false,
        error: "Only staff accounts can be deleted from this section."
      }, 403);
    }
    // =============================================
    // DELETE AUTH USER
    // =============================================
    const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      console.error("Auth user deletion failed:", deleteError);
      return jsonResponse({
        success: false,
        error: deleteError.message || "Unable to delete staff account."
      }, 500);
    }
    // =============================================
    // SUCCESS
    // =============================================
    return jsonResponse({
      success: true,
      message: "Staff account deleted permanently.",
      user_id: targetUserId
    }, 200);
  } catch (error) {
    console.error("Delete staff function error:", error);
    return jsonResponse({
      success: false,
      error: "An unexpected server error occurred."
    }, 500);
  }
});
