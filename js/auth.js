import { supabase } from "./supabase.js";


// =========================================
// AUTHENTICATION STATE
// =========================================

let currentUser = null;
let currentProfile = null;


// =========================================
// GET CURRENT PROFILE
// =========================================

export function getCurrentProfile() {
    return currentProfile;
}


// =========================================
// LOAD USER PROFILE
// =========================================

async function loadUserProfile(user) {

    if (!user) {
        currentUser = null;
        currentProfile = null;
        return null;
    }

    currentUser = user;

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role, is_active")
        .eq("id", user.id)
        .single();

    if (profileError) {

        console.error(
            "Profile loading failed:",
            profileError
        );

        await supabase.auth.signOut();

        currentUser = null;
        currentProfile = null;

        return null;
    }

    if (!profile.is_active) {

        await supabase.auth.signOut();

        currentUser = null;
        currentProfile = null;

        return null;
    }

    currentProfile = profile;

    return currentProfile;
}


// =========================================
// LOGIN
// =========================================

export async function loginUser(email, password) {

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {

        console.error(
            "Login failed:",
            error
        );

        return {
            success: false,
            error: error.message
        };
    }

    const profile =
        await loadUserProfile(data.user);

    if (!profile) {

        return {
            success: false,
            error: "User profile could not be loaded."
        };
    }

    console.log("Login successful.");
    console.log("User:", currentUser);
    console.log("Profile:", currentProfile);

    return {
        success: true,
        user: currentUser,
        profile: currentProfile
    };
}


// =========================================
// LOGOUT
// =========================================

export async function logoutUser() {

    const { error } =
        await supabase.auth.signOut();

    if (error) {

        console.error(
            "Logout failed:",
            error
        );

        return false;
    }

    currentUser = null;
    currentProfile = null;

    console.log(
        "Logged out successfully."
    );

    return true;
}


// =========================================
// CHECK CURRENT SESSION
// =========================================

export async function checkAuthSession() {

    const { data, error } =
        await supabase.auth.getSession();

    if (error) {

        console.error(
            "Session check failed:",
            error
        );

        return null;
    }

    if (!data.session) {

        console.log(
            "No active session."
        );

        return null;
    }

    const profile =
        await loadUserProfile(
            data.session.user
        );

    if (!profile) {
        return null;
    }

    console.log(
        "Active session found."
    );

    console.log(
        "Current profile:",
        currentProfile
    );

    return currentProfile;
}


// =========================================
// AUTH STATE LISTENER
// =========================================

supabase.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Auth event:",
            event
        );

        if (!session) {

            currentUser = null;
            currentProfile = null;

        } else {

            currentUser = session.user;
        }
    }
);


// =========================================
// LOGIN PAGE
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const loginForm =
            document.getElementById(
                "login-form"
            );

        // This code only runs on login.html
        if (!loginForm) {
            return;
        }

        // If already logged in,
        // go directly to the portal.
        const existingProfile =
            await checkAuthSession();

        if (existingProfile) {

            window.location.href =
                "index.html";

            return;
        }


        // =====================================
        // LOGIN FORM HANDLER
        // =====================================

        loginForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();

                const emailInput =
                    document.getElementById(
                        "login-email"
                    );

                const passwordInput =
                    document.getElementById(
                        "login-password"
                    );

                const loginButton =
                    document.getElementById(
                        "login-button"
                    );

                const loginError =
                    document.getElementById(
                        "login-error"
                    );


                const email =
                    emailInput.value.trim();

                const password =
                    passwordInput.value;


                loginError.textContent = "";

                loginButton.disabled = true;

                loginButton.textContent =
                    "Logging in...";


                const result =
                    await loginUser(
                        email,
                        password
                    );


                if (!result.success) {

                    loginError.textContent =
                        result.error;

                    loginButton.disabled =
                        false;

                    loginButton.textContent =
                        "Login";

                    return;
                }


                // Successful login
                window.location.href =
                    "index.html";
            }
        );
    }
);


// =========================================
// LOGOUT BUTTON
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const logoutButton =
            document.getElementById(
                "logout-button"
            );

        // Logout button only exists
        // on the portal page.
        if (!logoutButton) {
            return;
        }


        logoutButton.addEventListener(
            "click",
            async () => {

                logoutButton.disabled =
                    true;

                logoutButton.textContent =
                    "Logging out...";


                const success =
                    await logoutUser();


                if (success) {

                    window.location.href =
                        "login.html";

                } else {

                    logoutButton.disabled =
                        false;

                    logoutButton.textContent =
                        "Logout";
                }
            }
        );
    }
);