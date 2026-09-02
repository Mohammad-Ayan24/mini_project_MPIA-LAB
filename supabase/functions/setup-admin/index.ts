import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-setup-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getServerKey() {
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");

  if (secretKeysRaw) {
    try {
      const secretKeys = JSON.parse(secretKeysRaw);

      if (secretKeys && typeof secretKeys === "object") {
        const defaultKey = secretKeys.default;

        if (
          typeof defaultKey === "string" &&
          defaultKey.length > 0
        ) {
          return defaultKey;
        }
      }
    } catch (error) {
      console.error(
        "Unable to parse SUPABASE_SECRET_KEYS:",
        error
      );
    }
  }

  const serviceRoleKey = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY"
  );

  if (
    serviceRoleKey &&
    serviceRoleKey.length > 0
  ) {
    return serviceRoleKey;
  }

  throw new Error(
    "No Supabase server secret key is configured."
  );
}

Deno.serve(async (req) => {
  try {
    // =============================================
    // CORS
    // =============================================

    if (req.method === "OPTIONS") {
      return new Response("ok", {
        status: 200,
        headers: corsHeaders,
      });
    }

    // =============================================
    // ONLY POST
    // =============================================

    if (req.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          error: "Method not allowed.",
        },
        405
      );
    }

    // =============================================
    // SECURE INITIAL SETUP TOKEN
    // =============================================

    const bootstrapToken =
      Deno.env.get("SETUP_ADMIN_TOKEN");

    if (!bootstrapToken) {
      return jsonResponse(
        {
          success: false,
          error:
            "Initial administrator setup is not configured.",
        },
        503
      );
    }

    const suppliedToken =
      req.headers.get("x-setup-token");

    if (
      !suppliedToken ||
      suppliedToken !== bootstrapToken
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Invalid setup token.",
        },
        401
      );
    }

    // =============================================
    // SUPABASE URL
    // =============================================

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    if (!supabaseUrl) {
      return jsonResponse(
        {
          success: false,
          error:
            "Supabase URL is not configured.",
        },
        500
      );
    }

    // =============================================
    // SERVER CLIENT
    // =============================================

    const serverKey = getServerKey();

    const adminClient = createClient(
      supabaseUrl,
      serverKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // =============================================
    // CHECK WHETHER ADMIN ALREADY EXISTS
    // =============================================

    const {
      data: existingAdmin,
      error: existingAdminError,
    } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (existingAdminError) {
      console.error(
        "Admin lookup failed:",
        existingAdminError
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Unable to check existing administrator.",
        },
        500
      );
    }

    if (existingAdmin) {
      return jsonResponse(
        {
          success: false,
          error:
            "An active administrator already exists. Initial setup has already been completed.",
        },
        409
      );
    }

    // =============================================
    // READ REQUEST BODY
    // =============================================

    let body;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body.",
        },
        400
      );
    }

    // =============================================
    // READ FIELDS
    // =============================================

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    // =============================================
    // VALIDATION
    // =============================================

    if (!fullName) {
      return jsonResponse(
        {
          success: false,
          error: "Full name is required.",
        },
        400
      );
    }

    if (!email) {
      return jsonResponse(
        {
          success: false,
          error: "Email address is required.",
        },
        400
      );
    }

    if (!password) {
      return jsonResponse(
        {
          success: false,
          error: "Password is required.",
        },
        400
      );
    }

    if (password.length < 8) {
      return jsonResponse(
        {
          success: false,
          error:
            "Password must be at least 8 characters.",
        },
        400
      );
    }

    // =============================================
    // CREATE AUTH USER
    // =============================================

    const {
      data: authData,
      error: authError,
    } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error(
        "Auth user creation failed:",
        authError
      );

      const message =
        authError.message || "";

      if (
        message
          .toLowerCase()
          .includes("already registered") ||
        message
          .toLowerCase()
          .includes("already exists")
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "A user with this email address already exists.",
          },
          409
        );
      }

      return jsonResponse(
        {
          success: false,
          error:
            message ||
            "Unable to create authentication account.",
        },
        400
      );
    }

    if (!authData?.user) {
      return jsonResponse(
        {
          success: false,
          error:
            "Authentication account was not created.",
        },
        500
      );
    }

    const newUserId = authData.user.id;

    // =============================================
    // CREATE ADMIN PROFILE
    // =============================================

    const {
      error: profileError,
    } = await adminClient
      .from("profiles")
      .insert({
        id: newUserId,
        full_name: fullName,
        role: "admin",
        phone: null,
        is_active: true,
      });

    // =============================================
    // ROLLBACK AUTH USER IF PROFILE FAILS
    // =============================================

    if (profileError) {
      console.error(
        "Admin profile creation failed:",
        profileError
      );

      await adminClient.auth.admin.deleteUser(
        newUserId
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Administrator profile could not be created.",
        },
        500
      );
    }

    // =============================================
    // SUCCESS
    // =============================================

    return jsonResponse(
      {
        success: true,
        message:
          "Initial administrator created successfully.",
        user_id: newUserId,
      },
      201
    );
  } catch (error) {
    console.error(
      "Unexpected setup-admin error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          "An unexpected error occurred during administrator setup.",
      },
      500
    );
  }
});