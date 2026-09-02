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
// GET SERVER SUPABASE SECRET KEY
// =====================================================
function getServerKey() {
  // New Supabase secret-key format
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysRaw) {
    try {
      const secretKeys = JSON.parse(secretKeysRaw);
      if (secretKeys && typeof secretKeys === "object") {
        const defaultKey = secretKeys.default;
        if (typeof defaultKey === "string" && defaultKey.length > 0) {
          return defaultKey;
        }
      }
    } catch (error) {
      console.error("Unable to parse SUPABASE_SECRET_KEYS:", error);
    }
  }
  // Legacy fallback
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && serviceRoleKey.length > 0) {
    return serviceRoleKey;
  }
  throw new Error("No Supabase server secret key is configured.");
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
    // READ AUTHORIZATION HEADER
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
    // SERVER-ONLY SUPABASE CLIENT
    // =============================================
    const serverKey = getServerKey();
    const adminClient = createClient(supabaseUrl, serverKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    // =============================================
    // VALIDATE CALLER'S ACCESS TOKEN
    // =============================================
    const { data: userData, error: userError } = await adminClient.auth.getUser(accessToken);
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
    const { data: callerProfile, error: callerProfileError } = await adminClient.from("profiles").select("id, role, is_active").eq("id", callerId).maybeSingle();
    if (callerProfileError) {
      console.error("Caller profile lookup failed:", callerProfileError);
      return jsonResponse({
        success: false,
        error: "Unable to verify administrator account."
      }, 500);
    }
    // =============================================
    // ADMIN CHECK
    // =============================================
    if (!callerProfile || callerProfile.role !== "admin" || callerProfile.is_active !== true) {
      return jsonResponse({
        success: false,
        error: "You are not authorized to create staff accounts."
      }, 403);
    }
    // =============================================
    // READ REQUEST BODY
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
    // =============================================
    // READ FIELDS
    // =============================================
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    // =============================================
    // VALIDATION
    // =============================================
    if (!fullName) {
      return jsonResponse({
        success: false,
        error: "Full name is required."
      }, 400);
    }
    if (!email) {
      return jsonResponse({
        success: false,
        error: "Email address is required."
      }, 400);
    }
    if (!password) {
      return jsonResponse({
        success: false,
        error: "Password is required."
      }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({
        success: false,
        error: "Password must be at least 8 characters."
      }, 400);
    }
    // =============================================
    // CREATE AUTH USER
    // =============================================
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });
    if (authError) {
      console.error("Auth user creation failed:", authError);
      const message = authError.message || "";
      if (message.toLowerCase().includes("already registered") || message.toLowerCase().includes("already exists")) {
        return jsonResponse({
          success: false,
          error: "A user with this email address already exists."
        }, 409);
      }
      return jsonResponse({
        success: false,
        error: message || "Unable to create authentication account."
      }, 400);
    }
    if (!authData?.user) {
      return jsonResponse({
        success: false,
        error: "Authentication account was not created."
      }, 500);
    }
    const newUserId = authData.user.id;
    // =============================================
    // CREATE PROFILE
    // =============================================
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: newUserId,
      full_name: fullName,
      role: "staff",
      phone: phone || null,
      is_active: true
    });
    // =============================================
    // ROLLBACK AUTH USER
    // =============================================
    if (profileError) {
      console.error("Profile creation failed:", profileError);
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(newUserId);
      if (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
      return jsonResponse({
        success: false,
        error: "Staff profile could not be created. The account was rolled back."
      }, 500);
    }
    // =============================================
    // SUCCESS
    // =============================================
    return jsonResponse({
      success: true,
      message: "Staff account created successfully.",
      user_id: newUserId
    }, 201);
  } catch (error) {
    console.error("Create staff function error:", error);
    return jsonResponse({
      success: false,
      error: "An unexpected server error occurred."
    }, 500);
  }
});
