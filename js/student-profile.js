import { supabase } from "./supabase.js";

import {
    checkAuthSession,
    getCurrentProfile
} from "./auth.js";

let currentStudent = null;


// =====================================================
// GET ADMISSION NUMBER FROM URL
// =====================================================

function getAdmissionNumber() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get(
        "admission"
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// DISPLAY VALUE
// =====================================================

function displayValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    return escapeHtml(value);

}


// =====================================================
// PROFILE FIELD
// =====================================================

function profileField(
    label,
    value,
    fullWidth = false
) {

    return `

        <div
            class="profile-field ${fullWidth
            ? "full"
            : ""
        }"
        >

            <span
                class="profile-label"
            >
                ${escapeHtml(label)}
            </span>


            <div
                class="profile-value"
            >

                ${displayValue(value)}

            </div>

        </div>

    `;

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// LOAD STUDENT PROFILE
// =====================================================

async function loadStudentProfile() {

    const card =
        document.getElementById(
            "student-profile-card"
        );


    const admissionNumber =
        getAdmissionNumber();


    if (!admissionNumber) {

        card.innerHTML = `

            <div class="error-message">

                Student admission number
                was not provided.

            </div>

        `;

        return;

    }


    // =============================================
    // LOAD STUDENT
    // =============================================

    const {
        data: student,
        error: studentError
    } = await supabase

        .from("students")

        .select(`

            admission_number,

            student_name,

            gender,

            date_of_birth,

            pen_number,

            social_category,

            nationality,

            blood_group,

            student_photo,


            mother_name,

            father_name,

            guardian_name,


            mobile_number,

            alternate_mobile_number,

            email,

            address,

            pincode,


            student_status,

            created_at,

            updated_at

        `)

        .eq(
            "admission_number",
            admissionNumber
        )

        .single();


    if (studentError) {

        console.error(
            "Student loading error:",
            studentError
        );


        card.innerHTML = `

            <div class="error-message">

                Unable to load student profile.

            </div>

        `;

        return;

    }


    if (!student) {

        card.innerHTML = `

            <div class="error-message">

                Student not found.

            </div>

        `;

        return;

    }
    currentStudent = student;


    // =============================================
    // LOAD ENROLLMENT
    // =============================================

    const {
        data: enrollments,
        error: enrollmentError
    } = await supabase

        .from(
            "student_enrollments"
        )

        .select(`

            admission_date,

            academic_year_id,

            class_id,

            section_id,

            previous_school_name,


            academic_years (

                id,

                name,

                is_current

            ),


            classes (

                id,

                name

            ),


            sections (

                id,

                name

            )

        `)

        .eq(
            "admission_number",
            admissionNumber
        )

        .order(
            "admission_date",
            {
                ascending: false
            }
        );


    if (enrollmentError) {

        console.error(
            "Enrollment loading error:",
            enrollmentError
        );

    }


    const enrollment =
        (
            enrollments ||
            []
        ).find(
            item =>
                item
                    .academic_years
                    ?.is_current === true
        )
        ||
        (
            enrollments ||
            []
        )[0]
        ||
        null;


    // =============================================
    // STUDENT INITIAL
    // =============================================

    const initial =
        (
            student.student_name ||
            "?"
        )
            .charAt(0)
            .toUpperCase();


    // =============================================
    // STUDENT PHOTO
    // =============================================

    let photoHtml = `

        <span>
            ${escapeHtml(initial)}
        </span>

    `;


    if (
        student.student_photo
    ) {

        photoHtml = `

            <img
                src="${escapeHtml(
            student.student_photo
        )}"
                alt="Student Photo"
            >

        `;

    }


    // =============================================
    // STATUS
    // =============================================

    const status =
        student.student_status ||
        "-";


    const statusClass =
        status.toLowerCase() ===
            "active"

            ? "active"

            : "inactive";


    // =============================================
    // RENDER PAGE
    // =============================================

    card.innerHTML = `

        <!-- =====================================
             HEADER
        ====================================== -->

        <div
            class="student-profile-header"
        >

            <div
                class="student-profile-photo"
            >

                ${photoHtml}

            </div>


            <div>

                <h1
                    class="student-profile-name"
                >

                    ${displayValue(
        student.student_name
    )}

                </h1>


                <p
                    class="student-profile-admission"
                >

                    Admission Number:

                    <strong>
                        ${displayValue(
        student.admission_number
    )}
                    </strong>

                </p>


                <div
                    class="student-profile-status"
                >

                    <span
                        class="student-status ${statusClass}"
                    >

                        ${displayValue(
        status
    )}

                    </span>

                </div>

            </div>

        </div>


        <div
            class="student-profile-content"
        >


            <!-- =================================
                 STUDENT INFORMATION
            ================================== -->

            <section
                class="profile-section"
            >

                <h2
                    class="profile-section-title"
                >
                    Student Information
                </h2>


                <div
                    class="profile-grid"
                >

                    ${profileField(
        "Student Name",
        student.student_name
    )}


                    ${profileField(
        "Admission Number",
        student.admission_number
    )}


                    ${profileField(
        "Gender",
        student.gender
    )}


                    ${profileField(
        "Date of Birth",
        formatDate(
            student.date_of_birth
        )
    )}


                    ${profileField(
        "PEN Number",
        student.pen_number
    )}


                    ${profileField(
        "Social Category",
        student.social_category
    )}


                    ${profileField(
        "Nationality",
        student.nationality
    )}


                    ${profileField(
        "Blood Group",
        student.blood_group
    )}


                    ${profileField(
        "Student Status",
        student.student_status
    )}

                </div>

            </section>


            <!-- =================================
                 PARENT / GUARDIAN
            ================================== -->

            <section
                class="profile-section"
            >

                <h2
                    class="profile-section-title"
                >
                    Parent / Guardian Information
                </h2>


                <div
                    class="profile-grid"
                >

                    ${profileField(
        "Father's Name",
        student.father_name
    )}


                    ${profileField(
        "Mother's Name",
        student.mother_name
    )}


                    ${profileField(
        "Guardian's Name",
        student.guardian_name
    )}

                </div>

            </section>


            <!-- =================================
                 CONTACT
            ================================== -->

            <section
                class="profile-section"
            >

                <h2
                    class="profile-section-title"
                >
                    Contact Information
                </h2>


                <div
                    class="profile-grid"
                >

                    ${profileField(
        "Mobile Number",
        student.mobile_number
    )}


                    ${profileField(
        "Alternate Mobile Number",
        student.alternate_mobile_number
    )}


                    ${profileField(
        "Email",
        student.email
    )}


                    ${profileField(
        "Pincode",
        student.pincode
    )}


                    ${profileField(
        "Address",
        student.address,
        true
    )}

                </div>

            </section>


            <!-- =================================
                 ACADEMIC
            ================================== -->

            <section
                class="profile-section"
            >

                <h2
                    class="profile-section-title"
                >
                    Academic Information
                </h2>


                <div
                    class="profile-grid"
                >

                    ${profileField(
        "Academic Year",
        enrollment
            ?.academic_years
            ?.name
    )}


                    ${profileField(
        "Class",
        enrollment
            ?.classes
            ?.name
    )}


                    ${profileField(
        "Section",
        enrollment
            ?.sections
            ?.name
    )}


                    ${profileField(
        "Admission Date",
        formatDate(
            enrollment
                ?.admission_date
        )
    )}


                    ${profileField(
        "Previous School",
        enrollment
            ?.previous_school_name,
        true
    )}

                </div>

            </section>


            <!-- =================================
                 RECORD
            ================================== -->

            <section
                class="profile-section"
            >

                <h2
                    class="profile-section-title"
                >
                    Record Information
                </h2>


                <div
                    class="profile-grid"
                >

                    ${profileField(
        "Record Created",
        formatDate(
            student.created_at
        )
    )}


                    ${profileField(
        "Last Updated",
        formatDate(
            student.updated_at
        )
    )}

                </div>

            </section>


        </div>

    `;

}

// =====================================================
// OPEN EDIT STUDENT FORM
// =====================================================

function openEditStudentForm() {

    if (!currentStudent) {

        alert(
            "Student information is not loaded yet."
        );

        return;

    }


    const card =
        document.getElementById(
            "student-profile-card"
        );


    card.innerHTML = `

        <div class="student-edit-header">

            <div>

                <h1 class="student-edit-title">
                    Edit Student
                </h1>

                <p class="student-edit-subtitle">
                    Update the student's information.
                </p>

            </div>

        </div>


        <form
            id="edit-student-form"
            class="student-edit-form"
        >


            <!-- =====================================
                 STUDENT INFORMATION
            ====================================== -->

            <section class="edit-section">

                <h2 class="edit-section-title">
                    Student Information
                </h2>


                <div class="edit-grid">


                    <div class="edit-field">

                        <label>
                            Admission Number
                        </label>

                        <input
                            type="text"
                            value="${escapeHtml(
        currentStudent.admission_number
    )}"
                            disabled
                        >

                        <small>
                            Admission number cannot be changed.
                        </small>

                    </div>


                    <div class="edit-field">

                        <label>
                            Student Name
                            <span>*</span>
                        </label>

                        <input
                            type="text"
                            id="edit-student-name"
                            value="${escapeHtml(
        currentStudent.student_name
    )}"
                            required
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            Gender
                            <span>*</span>
                        </label>

                        <select
                            id="edit-gender"
                            required
                        >

                            <option value="">
                                Select gender
                            </option>

                            <option
                                value="Male"
                                ${currentStudent.gender ===
            "Male"
            ? "selected"
            : ""
        }
                            >
                                Male
                            </option>

                            <option
                                value="Female"
                                ${currentStudent.gender ===
            "Female"
            ? "selected"
            : ""
        }
                            >
                                Female
                            </option>

                            <option
                                value="Other"
                                ${currentStudent.gender ===
            "Other"
            ? "selected"
            : ""
        }
                            >
                                Other
                            </option>

                        </select>

                    </div>


                    <div class="edit-field">

                        <label>
                            Date of Birth
                            <span>*</span>
                        </label>

                        <input
                            type="date"
                            id="edit-date-of-birth"
                            value="${currentStudent.date_of_birth || ""}"
                            required
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            PEN Number
                        </label>

                        <input
                            type="text"
                            id="edit-pen-number"
                            value="${escapeHtml(
            currentStudent.pen_number
        )}"
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            Social Category
                            <span>*</span>
                        </label>

                        <select
                            id="edit-social-category"
                            required
                        >

                            <option value="">
                                Select category
                            </option>

                            <option
                                value="General"
                                ${currentStudent.social_category ===
            "General"
            ? "selected"
            : ""
        }
                            >
                                General
                            </option>

                            <option
                                value="OBC"
                                ${currentStudent.social_category ===
            "OBC"
            ? "selected"
            : ""
        }
                            >
                                OBC
                            </option>

                            <option
                                value="SC"
                                ${currentStudent.social_category ===
            "SC"
            ? "selected"
            : ""
        }
                            >
                                SC
                            </option>

                            <option
                                value="ST"
                                ${currentStudent.social_category ===
            "ST"
            ? "selected"
            : ""
        }
                            >
                                ST
                            </option>

                            <option
                                value="EWS"
                                ${currentStudent.social_category ===
            "EWS"
            ? "selected"
            : ""
        }
                            >
                                EWS
                            </option>

                        </select>

                    </div>


                    <div class="edit-field">

                        <label>
                            Nationality
                            <span>*</span>
                        </label>

                        <input
                            type="text"
                            id="edit-nationality"
                            value="${escapeHtml(
            currentStudent.nationality
        )}"
                            required
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            Blood Group
                        </label>

                        <select
                            id="edit-blood-group"
                        >

                            <option value="">
                                Select blood group
                            </option>

                            <option value="A+"
                                ${currentStudent.blood_group ===
            "A+"
            ? "selected"
            : ""
        }
                            >
                                A+
                            </option>

                            <option value="A-"
                                ${currentStudent.blood_group ===
            "A-"
            ? "selected"
            : ""
        }
                            >
                                A-
                            </option>

                            <option value="B+"
                                ${currentStudent.blood_group ===
            "B+"
            ? "selected"
            : ""
        }
                            >
                                B+
                            </option>

                            <option value="B-"
                                ${currentStudent.blood_group ===
            "B-"
            ? "selected"
            : ""
        }
                            >
                                B-
                            </option>

                            <option value="AB+"
                                ${currentStudent.blood_group ===
            "AB+"
            ? "selected"
            : ""
        }
                            >
                                AB+
                            </option>

                            <option value="AB-"
                                ${currentStudent.blood_group ===
            "AB-"
            ? "selected"
            : ""
        }
                            >
                                AB-
                            </option>

                            <option value="O+"
                                ${currentStudent.blood_group ===
            "O+"
            ? "selected"
            : ""
        }
                            >
                                O+
                            </option>

                            <option value="O-"
                                ${currentStudent.blood_group ===
            "O-"
            ? "selected"
            : ""
        }
                            >
                                O-
                            </option>

                        </select>

                    </div>


                    <div class="edit-field">

                        <label>
                            Student Status
                        </label>

                        <select
                            id="edit-student-status"
                        >

                            <option
                                value="Active"
                                ${currentStudent.student_status ===
            "Active"
            ? "selected"
            : ""
        }
                            >
                                Active
                            </option>

                            <option
                                value="Inactive"
                                ${currentStudent.student_status ===
            "Inactive"
            ? "selected"
            : ""
        }
                            >
                                Inactive
                            </option>

                        </select>

                    </div>


                    <div class="edit-field full">

                        <label>
                            Student Photo URL
                        </label>

                        <input
                            type="text"
                            id="edit-student-photo"
                            value="${escapeHtml(
            currentStudent.student_photo
        )}"
                            placeholder="Photo URL"
                        >

                    </div>


                </div>

            </section>


            <!-- =====================================
                 PARENT / GUARDIAN
            ====================================== -->

            <section class="edit-section">

                <h2 class="edit-section-title">
                    Parent / Guardian Information
                </h2>


                <div class="edit-grid">


                    <div class="edit-field">

                        <label>
                            Father's Name
                            <span>*</span>
                        </label>

                        <input
                            type="text"
                            id="edit-father-name"
                            value="${escapeHtml(
            currentStudent.father_name
        )}"
                            required
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            Mother's Name
                            <span>*</span>
                        </label>

                        <input
                            type="text"
                            id="edit-mother-name"
                            value="${escapeHtml(
            currentStudent.mother_name
        )}"
                            required
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            Guardian's Name
                        </label>

                        <input
                            type="text"
                            id="edit-guardian-name"
                            value="${escapeHtml(
            currentStudent.guardian_name
        )}"
                        >

                    </div>


                </div>

            </section>


            <!-- =====================================
                 CONTACT
            ====================================== -->

            <section class="edit-section">

                <h2 class="edit-section-title">
                    Contact Information
                </h2>


                <div class="edit-grid">


                    <div class="edit-field">

                        <label>
                            Mobile Number
                            <span>*</span>
                        </label>

                        <input
                            type="tel"
                            id="edit-mobile-number"
                            value="${escapeHtml(
            currentStudent.mobile_number
        )}"
                            required
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            Alternate Mobile
                        </label>

                        <input
                            type="tel"
                            id="edit-alternate-mobile"
                            value="${escapeHtml(
            currentStudent.alternate_mobile_number
        )}"
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            id="edit-email"
                            value="${escapeHtml(
            currentStudent.email
        )}"
                        >

                    </div>


                    <div class="edit-field">

                        <label>
                            Pincode
                            <span>*</span>
                        </label>

                        <input
                            type="text"
                            id="edit-pincode"
                            value="${escapeHtml(
            currentStudent.pincode
        )}"
                            required
                        >

                    </div>


                    <div class="edit-field full">

                        <label>
                            Address
                            <span>*</span>
                        </label>

                        <textarea
                            id="edit-address"
                            rows="4"
                            required
                        >${escapeHtml(
            currentStudent.address
        )}</textarea>

                    </div>


                </div>

            </section>


            <!-- =====================================
                 ACTIONS
            ====================================== -->

            <div class="edit-actions">

                <button
                    type="button"
                    id="cancel-edit-button"
                    class="cancel-edit-button"
                >
                    Cancel
                </button>


                <button
                    type="submit"
                    id="save-student-button"
                    class="save-student-button"
                >
                    Save Changes
                </button>

            </div>


        </form>

    `;


    // =============================================
    // CANCEL
    // =============================================

    document
        .getElementById(
            "cancel-edit-button"
        )
        .addEventListener(
            "click",
            () => {

                loadStudentProfile();

            }
        );


    // =============================================
    // SAVE
    // =============================================

    document
        .getElementById(
            "edit-student-form"
        )
        .addEventListener(
            "submit",
            saveStudentChanges
        );

}

// =====================================================
// SAVE STUDENT CHANGES
// =====================================================

async function saveStudentChanges(
    event
) {

    event.preventDefault();


    const saveButton =
        document.getElementById(
            "save-student-button"
        );


    if (!currentStudent) {

        alert(
            "Student information is unavailable."
        );

        return;

    }


    // =============================================
    // GET VALUES
    // =============================================

    const studentName =
        document.getElementById(
            "edit-student-name"
        ).value.trim();


    const gender =
        document.getElementById(
            "edit-gender"
        ).value;


    const dateOfBirth =
        document.getElementById(
            "edit-date-of-birth"
        ).value;


    const penNumber =
        document.getElementById(
            "edit-pen-number"
        ).value.trim();


    const socialCategory =
        document.getElementById(
            "edit-social-category"
        ).value;


    const nationality =
        document.getElementById(
            "edit-nationality"
        ).value.trim();


    const bloodGroup =
        document.getElementById(
            "edit-blood-group"
        ).value;


    const studentPhoto =
        document.getElementById(
            "edit-student-photo"
        ).value.trim();


    const fatherName =
        document.getElementById(
            "edit-father-name"
        ).value.trim();


    const motherName =
        document.getElementById(
            "edit-mother-name"
        ).value.trim();


    const guardianName =
        document.getElementById(
            "edit-guardian-name"
        ).value.trim();


    const mobileNumber =
        document.getElementById(
            "edit-mobile-number"
        ).value.trim();


    const alternateMobile =
        document.getElementById(
            "edit-alternate-mobile"
        ).value.trim();


    const email =
        document.getElementById(
            "edit-email"
        ).value.trim();


    const pincode =
        document.getElementById(
            "edit-pincode"
        ).value.trim();


    const address =
        document.getElementById(
            "edit-address"
        ).value.trim();


    const studentStatus =
        document.getElementById(
            "edit-student-status"
        ).value;


    // =============================================
    // CONFIRM
    // =============================================

    const confirmed =
        confirm(
            "Save these changes to the student record?"
        );


    if (!confirmed) {

        return;

    }


    // =============================================
    // DISABLE BUTTON
    // =============================================

    saveButton.disabled =
        true;

    saveButton.textContent =
        "Saving...";


    try {

        // =========================================
        // ADMIN-ONLY RPC
        // =========================================

        const {
            data,
            error
        } = await supabase.rpc(
            "update_student",
            {

                p_admission_number:
                    currentStudent.admission_number,

                p_student_name:
                    studentName,

                p_gender:
                    gender,

                p_date_of_birth:
                    dateOfBirth,

                p_pen_number:
                    penNumber || null,

                p_social_category:
                    socialCategory,

                p_nationality:
                    nationality,

                p_blood_group:
                    bloodGroup || null,

                p_student_photo:
                    studentPhoto || null,

                p_mother_name:
                    motherName,

                p_father_name:
                    fatherName,

                p_guardian_name:
                    guardianName || null,

                p_mobile_number:
                    mobileNumber,

                p_alternate_mobile_number:
                    alternateMobile || null,

                p_email:
                    email || null,

                p_address:
                    address,

                p_pincode:
                    pincode,

                p_student_status:
                    studentStatus

            }
        );


        if (error) {

            console.error(
                "Student update error:",
                error
            );


            throw error;

        }


        console.log(
            "Student updated:",
            data
        );


        alert(
            "Student information updated successfully."
        );


        // =========================================
        // RELOAD PROFILE
        // =========================================

        await loadStudentProfile();


    } catch (error) {

        console.error(
            "Failed to update student:",
            error
        );


        alert(
            error.message ||
            "Unable to update student."
        );


        saveButton.disabled =
            false;

        saveButton.textContent =
            "Save Changes";

    }

}


// =====================================================
// INITIALIZE
// =====================================================

async function initializeStudentProfile() {

    try {

        const profile =
            await checkAuthSession();


        if (!profile) {

            window.location.href =
                "login.html";

            return;

        }


        const currentProfile =
            getCurrentProfile();


        // =========================================
        // ADMIN-ONLY EDIT BUTTON
        // =========================================

        const editButton =
            document.getElementById(
                "edit-student-button"
            );


        if (
            editButton &&
            currentProfile?.role === "admin"
        ) {

            editButton.style.display =
                "block";

            editButton.addEventListener(
                "click",
                openEditStudentForm
            );

        }


        // =========================================
        // BACK BUTTON
        // =========================================

        const backButton =
            document.getElementById(
                "back-to-students"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                () => {

                    window.close();

                }
            );

        }


        // =========================================
        // LOAD STUDENT
        // =========================================

        await loadStudentProfile();


    } catch (error) {

        console.error(
            "Student profile initialization failed:",
            error
        );


        const card =
            document.getElementById(
                "student-profile-card"
            );


        if (card) {

            card.innerHTML = `

                <div class="error-message">

                    Unable to initialize
                    student profile.

                    <br><br>

                    Check the browser console
                    for details.

                </div>

            `;

        }

    }

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeStudentProfile
);