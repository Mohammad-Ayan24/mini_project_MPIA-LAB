import {
    checkAuthSession,
    getCurrentProfile
} from "./auth.js";

import { supabase } from "./supabase.js";


// =========================================
// ELEMENTS
// =========================================

const admissionForm =
    document.getElementById("admission-form");

const academicYearSelect =
    document.getElementById("student-academic-year");

const classSelect =
    document.getElementById("student-class");

const sectionSelect =
    document.getElementById("student-section");

const messageBox =
    document.getElementById("admission-message");

const saveButton =
    document.getElementById("save-admission");

const cancelButton =
    document.getElementById("cancel-admission");

const backButton =
    document.getElementById("back-to-portal");


// =========================================
// MESSAGE
// =========================================

function showMessage(message, type = "error") {

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;

    messageBox.className =
        `admission-message ${type}`;
}


function clearMessage() {

    if (!messageBox) {
        return;
    }

    messageBox.textContent = "";

    messageBox.className =
        "admission-message";
}


// =========================================
// LOAD ACADEMIC YEARS
// =========================================

async function loadAcademicYears() {

    if (!academicYearSelect) {
        return;
    }

    academicYearSelect.innerHTML =
        `<option value="">
            Loading academic years...
        </option>`;


    const { data, error } =
        await supabase
            .from("academic_years")
            .select(
                "id, name, is_current"
            )
            .order("name", {
                ascending: false
            });


    if (error) {

        console.error(
            "Failed to load academic years:",
            error
        );

        academicYearSelect.innerHTML =
            `<option value="">
                Unable to load academic years
            </option>`;

        showMessage(
            "Unable to load academic years."
        );

        return;
    }


    academicYearSelect.innerHTML =
        `<option value="">
            Select academic year
        </option>`;


    data.forEach(year => {

        const option =
            document.createElement("option");


        option.value =
            year.id;


        option.textContent =
            year.name;


        if (year.is_current) {

            option.selected =
                true;

        }


        academicYearSelect.appendChild(
            option
        );

    });

}


// =========================================
// LOAD CLASSES
// =========================================

async function loadClasses() {

    if (!classSelect) {
        return;
    }

    classSelect.innerHTML =
        `<option value="">
            Loading classes...
        </option>`;


    const { data, error } =
        await supabase
            .from("classes")
            .select(
                "id, name, display_order"
            )
            .order("display_order", {
                ascending: true
            });


    if (error) {

        console.error(
            "Failed to load classes:",
            error
        );

        classSelect.innerHTML =
            `<option value="">
                Unable to load classes
            </option>`;

        showMessage(
            "Unable to load classes."
        );

        return;
    }


    classSelect.innerHTML =
        `<option value="">
            Select class
        </option>`;


    data.forEach(classItem => {

        const option =
            document.createElement("option");


        option.value =
            classItem.id;


        option.textContent =
            classItem.name;


        classSelect.appendChild(
            option
        );

    });

}


// =========================================
// LOAD SECTIONS
// =========================================

async function loadSections(classId) {

    if (!sectionSelect) {
        return;
    }


    if (!classId) {

        sectionSelect.innerHTML =
            `<option value="">
                Select class first
            </option>`;

        return;
    }


    sectionSelect.innerHTML =
        `<option value="">
            Loading sections...
        </option>`;


    const { data, error } =
        await supabase
            .from("sections")
            .select(
                "id, name"
            )
            .eq(
                "class_id",
                classId
            )
            .order("name", {
                ascending: true
            });


    if (error) {

        console.error(
            "Failed to load sections:",
            error
        );

        sectionSelect.innerHTML =
            `<option value="">
                Unable to load sections
            </option>`;

        showMessage(
            "Unable to load sections."
        );

        return;
    }


    sectionSelect.innerHTML =
        `<option value="">
            Select section
        </option>`;


    data.forEach(section => {

        const option =
            document.createElement("option");


        option.value =
            section.id;


        option.textContent =
            section.name;


        sectionSelect.appendChild(
            option
        );

    });

}


// =========================================
// FORM SUBMISSION
// =========================================

function setupForm() {

    if (!admissionForm) {
        return;
    }


    admissionForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            clearMessage();


            // =====================================
            // VALIDATE FORM
            // =====================================

            if (!admissionForm.checkValidity()) {

                admissionForm.reportValidity();

                return;

            }


            // =====================================
            // COLLECT FORM DATA
            // =====================================

            const formData =
                new FormData(admissionForm);


            const application = {

                student_name:
                    formData.get("student_name")?.trim(),

                gender:
                    formData.get("gender"),

                date_of_birth:
                    formData.get("date_of_birth"),

                pen_number:
                    formData.get("pen_number")?.trim(),

                social_category:
                    formData.get("social_category"),

                nationality:
                    formData.get("nationality")?.trim(),

                blood_group:
                    formData.get("blood_group"),

                student_photo:
                    formData.get("student_photo")?.trim(),

                mother_name:
                    formData.get("mother_name")?.trim(),

                father_name:
                    formData.get("father_name")?.trim(),

                guardian_name:
                    formData.get("guardian_name")?.trim(),

                mobile_number:
                    formData.get("mobile_number")?.trim(),

                alternate_mobile_number:
                    formData.get(
                        "alternate_mobile_number"
                    )?.trim(),

                email:
                    formData.get("email")?.trim(),

                address:
                    formData.get("address")?.trim(),

                pincode:
                    formData.get("pincode")?.trim(),

                academic_year_id:
                    formData.get("academic_year_id"),

                class_id:
                    formData.get("class_id"),

                section_id:
                    formData.get("section_id"),

                previous_school_name:
                    formData.get(
                        "previous_school_name"
                    )?.trim()

            };


            // =====================================
            // EXTRA CLIENT-SIDE VALIDATION
            // =====================================

            if (
                !application.academic_year_id
            ) {

                showMessage(
                    "Please select an academic year."
                );

                return;

            }


            if (
                !application.class_id
            ) {

                showMessage(
                    "Please select a class."
                );

                return;

            }


            if (
                !application.section_id
            ) {

                showMessage(
                    "Please select a section."
                );

                return;

            }


            // =====================================
            // DISABLE BUTTON
            // =====================================

            saveButton.disabled = true;

            saveButton.textContent =
                "Saving...";


            try {

                // =================================
                // CALL DATABASE FUNCTION
                // =================================

                const {
                    data: admissionNumber,
                    error
                } = await supabase.rpc(
                    "create_admin_student",
                    {
                        p_application:
                            application
                    }
                );


                if (error) {

                    console.error(
                        "Failed to create student:",
                        error
                    );

                    throw error;

                }


                // =================================
                // SUCCESS
                // =================================

                showMessage(
                    `Student created successfully. Admission Number: ${admissionNumber}`,
                    "success"
                );


                // =================================
                // RESET FORM
                // =================================

                admissionForm.reset();


                // Restore current academic year
                await loadAcademicYears();


                // Reset class dropdown
                if (classSelect) {

                    classSelect.value = "";

                }


                // Reset section dropdown
                if (sectionSelect) {

                    sectionSelect.innerHTML = `
                        <option value="">
                            Select class first
                        </option>
                    `;

                }


                console.log(
                    "Student created:",
                    admissionNumber
                );


            } catch (error) {

                console.error(
                    "Student creation failed:",
                    error
                );


                let message =
                    "Unable to create student.";


                if (
                    error?.message
                ) {

                    message =
                        error.message;

                }


                // Handle common duplicate PEN error
                if (
                    message.includes(
                        "students_pen_number_key"
                    )
                ) {

                    message =
                        "A student with this PEN number already exists.";

                }


                // Handle duplicate enrollment
                if (
                    message.includes(
                        "student_enrollments_admission_number_academic_year_id_key"
                    )
                ) {

                    message =
                        "This student is already enrolled in the selected academic year.";

                }


                showMessage(
                    message
                );


            } finally {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Save Student";

            }

        }
    );

}


// =========================================
// CLASS CHANGE
// =========================================

function setupClassSelection() {

    if (!classSelect) {
        return;
    }


    classSelect.addEventListener(
        "change",
        () => {

            clearMessage();

            loadSections(
                classSelect.value
            );

        }
    );

}


// =========================================
// NAVIGATION
// =========================================

function setupNavigation() {

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html";

            }
        );

    }


    if (backButton) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "index.html";

            }
        );

    }

}


// =========================================
// AUTHORIZATION
// =========================================

async function initializeAdmissionPage() {

    const profile =
        await checkAuthSession();


    if (!profile) {

        window.location.href =
            "login.html";

        return;

    }


    const currentProfile =
        getCurrentProfile();


    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {

        alert(
            "You do not have permission to access the admission page."
        );

        window.location.href =
            "index.html";

        return;

    }


    await Promise.all([
        loadAcademicYears(),
        loadClasses()
    ]);

}


// =========================================
// INITIALIZE
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavigation();

        setupClassSelection();

        setupForm();

        await initializeAdmissionPage();

    }
);