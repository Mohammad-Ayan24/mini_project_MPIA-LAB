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
        event => {

            event.preventDefault();

            clearMessage();


            /*
             * Database insertion will be implemented
             * after the admission form UI and dropdowns
             * have been tested.
             */


            showMessage(
                "The admission form is ready. Student saving will be connected in the next step.",
                "success"
            );

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