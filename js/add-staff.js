import {
    checkAuthSession,
    getCurrentProfile
} from "./auth.js";

import {
    supabase
} from "./supabase.js";


// =====================================================
// GLOBAL STATE
// =====================================================

let currentProfile = null;


// =====================================================
// INITIALIZE
// =====================================================

async function initializeAddUserPage() {

    try {

        // =============================================
        // CHECK LOGIN
        // =============================================

        const session =
            await checkAuthSession();


        if (!session) {

            window.location.href =
                "login.html";

            return;

        }


        // =============================================
        // GET CURRENT PROFILE
        // =============================================

        currentProfile =
            await getCurrentProfile();


        if (!currentProfile) {

            window.location.href =
                "login.html";

            return;

        }


        // =============================================
        // ADMIN ONLY
        // =============================================

        if (
            currentProfile.role !==
            "admin"
        ) {

            alert(
                "You do not have permission to add staff."
            );

            window.location.href =
                "index.html";

            return;

        }


        updateTopbar();

        setupForm();

        setupNavigation();

    } catch (error) {

        console.error(
            "Add User initialization error:",
            error
        );

        showMessage(
            "Unable to initialize the page.",
            "error"
        );

    }

}


// =====================================================
// TOPBAR
// =====================================================

function updateTopbar() {

    const name =
        currentProfile.full_name ||
        "User";


    const nameElement =
        document.getElementById(
            "topbar-user-name"
        );


    const roleElement =
        document.getElementById(
            "topbar-user-role"
        );


    const avatar =
        document.querySelector(
            ".avatar"
        );


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (roleElement) {

        roleElement.textContent =
            "Administrator";

    }


    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


// =====================================================
// FORM
// =====================================================

function setupForm() {

    const form =
        document.getElementById(
            "add-staff-form"
        );


    if (!form) {

        console.error(
            "add-staff-form was not found."
        );

        return;

    }


    form.addEventListener(
        "submit",
        handleFormSubmit
    );

}


// =====================================================
// SUBMIT
// =====================================================

async function handleFormSubmit(
    event
) {

    event.preventDefault();

    clearMessage();


    const fullNameInput =
        document.getElementById(
            "full-name"
        );


    const emailInput =
        document.getElementById(
            "email"
        );


    const phoneInput =
        document.getElementById(
            "phone"
        );


    const passwordInput =
        document.getElementById(
            "password"
        );


    const confirmPasswordInput =
        document.getElementById(
            "confirm-password"
        );


    const createButton =
        document.getElementById(
            "create-button"
        );


    // =============================================
    // CHECK ELEMENTS
    // =============================================

    if (
        !fullNameInput ||
        !emailInput ||
        !phoneInput ||
        !passwordInput ||
        !confirmPasswordInput ||
        !createButton
    ) {

        showMessage(
            "The staff form is missing required fields.",
            "error"
        );

        return;

    }


    // =============================================
    // VALUES
    // =============================================

    const fullName =
        fullNameInput.value.trim();


    const email =
        emailInput.value
            .trim()
            .toLowerCase();


    const phone =
        phoneInput.value.trim();


    const password =
        passwordInput.value;


    const confirmPassword =
        confirmPasswordInput.value;


    // =============================================
    // VALIDATION
    // =============================================

    if (!fullName) {

        showMessage(
            "Full name is required.",
            "error"
        );

        fullNameInput.focus();

        return;

    }


    if (!email) {

        showMessage(
            "Email address is required.",
            "error"
        );

        emailInput.focus();

        return;

    }


    if (
        !emailInput.checkValidity()
    ) {

        showMessage(
            "Please enter a valid email address.",
            "error"
        );

        emailInput.focus();

        return;

    }


    if (
        password.length <
        8
    ) {

        showMessage(
            "Password must be at least 8 characters.",
            "error"
        );

        passwordInput.focus();

        return;

    }


    if (
        password !==
        confirmPassword
    ) {

        showMessage(
            "Passwords do not match.",
            "error"
        );

        confirmPasswordInput.focus();

        return;

    }


    // =============================================
    // DISABLE BUTTON
    // =============================================

    createButton.disabled =
        true;

    createButton.textContent =
        "Creating...";


    try {

        // =========================================
        // GET CURRENT SESSION
        // =========================================

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabase.auth
                .getSession();


        if (sessionError) {

            console.error(
                "Session error:",
                sessionError
            );

            showMessage(
                "Unable to verify your login session.",
                "error"
            );

            return;

        }


        const session =
            sessionData?.session;


        if (!session) {

            showMessage(
                "Your login session has expired. Please log in again.",
                "error"
            );

            window.location.href =
                "login.html";

            return;

        }


        const accessToken =
            session.access_token;


        if (!accessToken) {

            showMessage(
                "Your login session does not contain a valid access token.",
                "error"
            );

            return;

        }


        // =========================================
        // CALL EDGE FUNCTION
        // =========================================

        const {
            data,
            error
        } =
            await supabase.functions.invoke(
                "create-staff",
                {
                    body: {

                        full_name:
                            fullName,

                        email:
                            email,

                        phone:
                            phone,

                        password:
                            password

                    },

                    headers: {

                        Authorization:
                            `Bearer ${accessToken}`

                    }

                }
            );


        // =========================================
        // HANDLE FUNCTION ERROR
        // =========================================

        if (error) {

            console.error(
                "Create staff function error:",
                error
            );


            // Try to read the actual
            // Edge Function response
            let serverMessage = "";


            if (
                error.context &&
                typeof error.context
                    .clone ===
                    "function"
            ) {

                try {

                    const response =
                        await error.context
                            .clone();


                    const body =
                        await response
                            .json();


                    if (
                        body &&
                        typeof body.error ===
                            "string"
                    ) {

                        serverMessage =
                            body.error;

                    }

                } catch {

                    // Ignore response
                    // parsing failure.

                }

            }


            showMessage(
                serverMessage ||
                error.message ||
                "Unable to create staff account.",
                "error"
            );

            return;

        }


        // =========================================
        // HANDLE SERVER ERROR
        // =========================================

        if (
            !data ||
            data.success !== true
        ) {

            showMessage(
                data?.error ||
                "Staff account could not be created.",
                "error"
            );

            return;

        }


        // =========================================
        // SUCCESS
        // =========================================

        showMessage(
            "Staff account created successfully.",
            "success"
        );


        // Clear fields

        fullNameInput.value =
            "";

        emailInput.value =
            "";

        phoneInput.value =
            "";

        passwordInput.value =
            "";

        confirmPasswordInput.value =
            "";


    } catch (error) {

        console.error(
            "Unexpected create staff error:",
            error
        );


        showMessage(
            "An unexpected error occurred while creating the staff account.",
            "error"
        );


    } finally {

        createButton.disabled =
            false;

        createButton.textContent =
            "Create Staff";

    }

}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "form-message"
        );


    if (!messageElement) {

        return;

    }


    messageElement.textContent =
        message;


    messageElement.className =
        `form-message ${type}`;

}


function clearMessage() {

    const messageElement =
        document.getElementById(
            "form-message"
        );


    if (!messageElement) {

        return;

    }


    messageElement.textContent =
        "";

    messageElement.className =
        "form-message";

}


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

    const backButton =
        document.getElementById(
            "back-button"
        );


    const cancelButton =
        document.getElementById(
            "cancel-button"
        );


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html";

            }
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html";

            }
        );

    }

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeAddUserPage
);