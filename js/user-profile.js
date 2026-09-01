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

let selectedUser = null;


// =====================================================
// INITIALIZE
// =====================================================

async function initializeUserProfile() {

    try {

        // =============================================
        // CHECK LOGIN
        // =============================================

        const session =
            await checkAuthSession();


        if (!session) {

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
            currentProfile.role !== "admin"
        ) {

            window.location.href =
                "index.html";

            return;

        }


        updateTopbar();


        // =============================================
        // GET USER ID FROM URL
        // =============================================

        const params =
            new URLSearchParams(
                window.location.search
            );


        const userId =
            params.get("id");


        if (!userId) {

            showError(
                "No user was selected."
            );

            return;

        }


        // =============================================
        // LOAD USER
        // =============================================

        await loadUser(
            userId
        );


    } catch (error) {

        console.error(
            "User profile initialization error:",
            error
        );


        showError(
            "Unable to load user."
        );

    }

}


// =====================================================
// LOAD USER
// =====================================================

async function loadUser(
    userId
) {

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(`
            id,
            full_name,
            role,
            phone,
            is_active,
            created_at,
            updated_at
        `)
        .eq(
            "id",
            userId
        )
        .maybeSingle();


    if (error) {

        console.error(
            "Failed to load user:",
            error
        );


        showError(
            "Unable to load user."
        );


        return;

    }


    if (!data) {

        showError(
            "User not found."
        );


        return;

    }


    selectedUser =
        data;


    renderUser(
        selectedUser
    );

}


// =====================================================
// RENDER USER
// =====================================================

function renderUser(
    user
) {

    const name =
        user.full_name ||
        "Unnamed User";


    const role =
        user.role === "admin"
            ? "Administrator"
            : "Staff";


    const status =
        user.is_active
            ? "Active"
            : "Inactive";


    const firstLetter =
        name
            .charAt(0)
            .toUpperCase();


    // =============================================
    // HEADER
    // =============================================

    document.getElementById(
        "profile-name"
    ).textContent =
        name;


    document.getElementById(
        "profile-role"
    ).textContent =
        role;


    document.getElementById(
        "profile-avatar"
    ).textContent =
        firstLetter;


    const statusBadge =
        document.getElementById(
            "profile-status"
        );


    statusBadge.textContent =
        status;


    statusBadge.className =
        `badge ${user.is_active
            ? "green-badge"
            : "yellow-badge"
        }`;


    // =============================================
    // EDITABLE FIELDS
    // =============================================

    document.getElementById(
        "full-name-input"
    ).value =
        user.full_name ||
        "";


    document.getElementById(
        "phone-input"
    ).value =
        user.phone ||
        "";


    document.getElementById(
        "role-input"
    ).value =
        user.role ||
        "staff";


    document.getElementById(
        "status-input"
    ).value =
        user.is_active
            ? "active"
            : "inactive";


    // =============================================
    // ACCOUNT INFORMATION
    // =============================================

    document.getElementById(
        "profile-user-id"
    ).textContent =
        user.id;


    document.getElementById(
        "profile-created"
    ).textContent =
        formatDate(
            user.created_at
        );


    document.getElementById(
        "profile-updated"
    ).textContent =
        formatDate(
            user.updated_at
        );


    // =============================================
    // SHOW PAGE
    // =============================================

    document.getElementById(
        "profile-loading"
    ).style.display =
        "none";


    document.getElementById(
        "user-profile-content"
    ).style.display =
        "block";

}


// =====================================================
// TOPBAR
// =====================================================

function updateTopbar() {

    const name =
        currentProfile.full_name ||
        "User";


    document.getElementById(
        "topbar-user-name"
    ).textContent =
        name;


    document.getElementById(
        "topbar-user-role"
    ).textContent =
        currentProfile.role === "admin"
            ? "Administrator"
            : "Staff";


    const avatar =
        document.querySelector(
            ".avatar"
        );


    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    return new Date(
        value
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// ERROR
// =====================================================

function showError(
    message
) {

    const loading =
        document.getElementById(
            "profile-loading"
        );


    const errorElement =
        document.getElementById(
            "profile-error"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (errorElement) {

        errorElement.textContent =
            message;

        errorElement.style.display =
            "block";

    }

}

// =====================================================
// DELETE STAFF MODAL
// =====================================================

function openDeleteStaffModal() {

    if (!selectedUser) {
        return;
    }

    const modal =
        document.getElementById(
            "delete-staff-modal"
        );

    const nameElement =
        document.getElementById(
            "delete-staff-name"
        );

    if (!modal) {
        return;
    }

    if (nameElement) {
        nameElement.textContent =
            selectedUser.full_name ||
            "this staff member";
    }

    modal.style.display =
        "flex";
}


function closeDeleteStaffModal() {

    const modal =
        document.getElementById(
            "delete-staff-modal"
        );

    if (!modal) {
        return;
    }

    modal.style.display =
        "none";
}

// =====================================================
// DELETE STAFF ACCOUNT
// =====================================================

async function deleteStaffAccount() {

    if (!selectedUser) {
        return;
    }

    const confirmButton =
        document.getElementById(
            "delete-modal-confirm"
        );

    if (confirmButton) {
        confirmButton.disabled = true;
        confirmButton.textContent =
            "Deleting...";
    }

    try {

        // =============================================
        // GET CURRENT SESSION
        // =============================================

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabase.auth.getSession();


        if (sessionError) {

            console.error(
                "Session error:",
                sessionError
            );

            alert(
                "Unable to verify your login session."
            );

            return;
        }


        const session =
            sessionData?.session;


        if (!session) {

            alert(
                "Your login session has expired. Please log in again."
            );

            window.location.href =
                "login.html";

            return;
        }


        const accessToken =
            session.access_token;


        if (!accessToken) {

            alert(
                "No valid access token was found."
            );

            return;
        }


        // =============================================
        // CALL DELETE STAFF EDGE FUNCTION
        // =============================================

        const {
            data,
            error
        } =
            await supabase.functions.invoke(
                "delete-user",
                {
                    body: {
                        user_id:
                            selectedUser.id
                    },

                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );


        // =============================================
        // HANDLE FUNCTION ERROR
        // =============================================

        if (error) {

            console.error(
                "Delete staff function error:",
                error
            );


            let serverMessage = "";


            if (
                error.context &&
                typeof error.context.clone ===
                "function"
            ) {

                try {

                    const response =
                        await error.context.clone();

                    const responseBody =
                        await response.json();

                    if (
                        responseBody &&
                        typeof responseBody.error ===
                        "string"
                    ) {

                        serverMessage =
                            responseBody.error;

                    }

                } catch {
                    // Ignore response parsing errors.
                }

            }


            alert(
                serverMessage ||
                error.message ||
                "Unable to delete staff account."
            );

            return;
        }


        // =============================================
        // SERVER REPORTED FAILURE
        // =============================================

        if (
            !data ||
            data.success !== true
        ) {

            alert(
                data?.error ||
                "Staff account could not be deleted."
            );

            return;
        }


        // =============================================
        // SUCCESS
        // =============================================

        alert(
            "Staff account deleted permanently."
        );


        // Close page
        window.close();


    } catch (error) {

        console.error(
            "Unexpected delete error:",
            error
        );

        alert(
            "An unexpected error occurred while deleting the staff account."
        );

    } finally {

        if (confirmButton) {

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Delete Permanently";

        }

    }

}


// =====================================================
// SAVE USER CHANGES
// =====================================================

async function saveUserChanges() {

    if (!selectedUser) {

        return;

    }


    const fullNameInput =
        document.getElementById(
            "full-name-input"
        );


    const phoneInput =
        document.getElementById(
            "phone-input"
        );


    const roleInput =
        document.getElementById(
            "role-input"
        );


    const statusInput =
        document.getElementById(
            "status-input"
        );


    const saveButton =
        document.getElementById(
            "save-button"
        );


    const fullName =
        fullNameInput.value.trim();


    const phone =
        phoneInput.value.trim();


    const role =
        roleInput.value;


    const isActive =
        statusInput.value === "active";


    // =============================================
    // VALIDATION
    // =============================================

    if (!fullName) {

        alert(
            "Full name is required."
        );

        fullNameInput.focus();

        return;

    }


    if (
        role !== "admin" &&
        role !== "staff"
    ) {

        alert(
            "Invalid role selected."
        );

        return;

    }


    // =============================================
    // PREVENT DOUBLE SUBMISSION
    // =============================================

    saveButton.disabled = true;

    saveButton.textContent =
        "Saving...";


    try {

        // =========================================
        // CALL SECURE SUPABASE FUNCTION
        // =========================================

        const {
            data,
            error
        } = await supabase.rpc(
            "update_user_profile",
            {
                p_user_id:
                    selectedUser.id,

                p_full_name:
                    fullName,

                p_phone:
                    phone,

                p_role:
                    role,

                p_is_active:
                    isActive
            }
        );


        if (error) {

            console.error(
                "Failed to update user:",
                error
            );


            alert(
                error.message ||
                "Unable to update user."
            );


            return;

        }


        // =========================================
        // UPDATE LOCAL USER DATA
        // =========================================

        selectedUser.full_name =
            fullName;

        selectedUser.phone =
            phone || null;

        selectedUser.role =
            role;

        selectedUser.is_active =
            isActive;

        selectedUser.updated_at =
            new Date().toISOString();


        // =========================================
        // UPDATE PAGE
        // =========================================

        renderUser(
            selectedUser
        );


        alert(
            data ||
            "User updated successfully."
        );


    } catch (error) {

        console.error(
            "Unexpected update error:",
            error
        );


        alert(
            "Unable to update user."
        );


    } finally {

        saveButton.disabled =
            false;

        saveButton.textContent =
            "Save Changes";

    }

}


// =====================================================
// CANCEL USER CHANGES
// =====================================================

function cancelUserChanges() {

    if (!selectedUser) {

        return;

    }


    renderUser(
        selectedUser
    );

}

// =====================================================
// SAVE / CANCEL BUTTONS
// =====================================================

document
    .getElementById(
        "save-button"
    )
    ?.addEventListener(
        "click",
        saveUserChanges
    );


document
    .getElementById(
        "cancel-button"
    )
    ?.addEventListener(
        "click",
        cancelUserChanges
    );

// =====================================================
// DELETE STAFF BUTTON
// =====================================================

document
    .getElementById(
        "delete-staff-button"
    )
    ?.addEventListener(
        "click",
        () => {

            openDeleteStaffModal();

        }
    );


// =====================================================
// DELETE MODAL CANCEL
// =====================================================

document
    .getElementById(
        "delete-modal-cancel"
    )
    ?.addEventListener(
        "click",
        () => {

            closeDeleteStaffModal();

        }
    );


// =====================================================
// DELETE MODAL OVERLAY
// =====================================================

document
    .querySelector(
        ".delete-modal-overlay"
    )
    ?.addEventListener(
        "click",
        () => {

            closeDeleteStaffModal();

        }
    );

// =====================================================
// DELETE MODAL CONFIRM
// =====================================================

document
    .getElementById(
        "delete-modal-confirm"
    )
    ?.addEventListener(
        "click",
        deleteStaffAccount
    );

// =====================================================
// BACK BUTTON
// =====================================================

document
    .getElementById(
        "back-button"
    )
    ?.addEventListener(
        "click",
        () => {

            window.close();

        }
    );


// =====================================================
// START
// =====================================================

initializeUserProfile();