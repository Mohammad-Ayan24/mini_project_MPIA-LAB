import { supabase } from "./supabase.js";

// =====================================================
// PAGE MODE
// =====================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const isStaffMode =
    urlParams.get("source") === "staff";

// =====================================================
// ELEMENTS
// =====================================================

const form =
    document.getElementById(
        "parent-admission-form"
    );


const academicYearSelect =
    document.getElementById(
        "academic-year"
    );


const classSelect =
    document.getElementById(
        "class"
    );


const sectionSelect =
    document.getElementById(
        "preferred-section"
    );


const messageBox =
    document.getElementById(
        "application-message"
    );


const submitButton =
    document.getElementById(
        "submit-application"
    );


const successScreen =
    document.getElementById(
        "success-screen"
    );


const applicationNumberElement =
    document.getElementById(
        "application-number"
    );


const newApplicationButton =
    document.getElementById(
        "new-application"
    );


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    type = "error"
) {

    if (!messageBox) {
        return;
    }


    messageBox.textContent =
        message;


    messageBox.className =
        `application-message ${type}`;

}


function clearMessage() {

    if (!messageBox) {
        return;
    }


    messageBox.textContent =
        "";


    messageBox.className =
        "application-message";

}


// =====================================================
// LOAD ACADEMIC YEARS
// =====================================================

async function loadAcademicYears() {

    academicYearSelect.innerHTML = `
        <option value="">
            Loading academic years...
        </option>
    `;


    const {
        data,
        error
    } = await supabase
        .from("academic_years")
        .select(
            "id, name, is_current"
        )
        .order(
            "name",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Failed to load academic years:",
            error
        );


        academicYearSelect.innerHTML = `
            <option value="">
                Unable to load academic years
            </option>
        `;


        showMessage(
            "Unable to load academic years."
        );


        return;

    }


    academicYearSelect.innerHTML = `
        <option value="">
            Select academic year
        </option>
    `;


    data.forEach(year => {

        const option =
            document.createElement(
                "option"
            );


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


// =====================================================
// LOAD CLASSES
// =====================================================

async function loadClasses() {

    classSelect.innerHTML = `
        <option value="">
            Loading classes...
        </option>
    `;


    const {
        data,
        error
    } = await supabase
        .from("classes")
        .select(
            "id, name, display_order"
        )
        .order(
            "display_order",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Failed to load classes:",
            error
        );


        classSelect.innerHTML = `
            <option value="">
                Unable to load classes
            </option>
        `;


        showMessage(
            "Unable to load classes."
        );


        return;

    }


    classSelect.innerHTML = `
        <option value="">
            Select class
        </option>
    `;


    data.forEach(classItem => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            classItem.id;


        option.textContent =
            classItem.name;


        classSelect.appendChild(
            option
        );

    });

}


// =====================================================
// LOAD SECTIONS
// =====================================================

async function loadSections(
    classId
) {

    if (!classId) {

        sectionSelect.innerHTML = `
            <option value="">
                Select class first
            </option>
        `;


        return;

    }


    sectionSelect.innerHTML = `
        <option value="">
            Loading sections...
        </option>
    `;


    const {
        data,
        error
    } = await supabase
        .from("sections")
        .select(
            "id, name"
        )
        .eq(
            "class_id",
            classId
        )
        .order(
            "name",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Failed to load sections:",
            error
        );


        sectionSelect.innerHTML = `
            <option value="">
                Unable to load sections
            </option>
        `;


        showMessage(
            "Unable to load sections."
        );


        return;

    }


    sectionSelect.innerHTML = `
        <option value="">
            No section preference
        </option>
    `;


    data.forEach(section => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            section.id;


        option.textContent =
            section.name;


        sectionSelect.appendChild(
            option
        );

    });

}


// =====================================================
// VALIDATION
// =====================================================

function validateForm() {

    const requiredFields =
        form.querySelectorAll(
            "[required]"
        );


    for (
        const field of requiredFields
    ) {

        // =========================================
        // REQUIRED CHECKBOX
        // =========================================

        if (
            field.type === "checkbox"
        ) {

            if (!field.checked) {

                showMessage(
                    `Please complete the required field: ${getFieldLabel(field)}.`
                );

                field.focus();

                return false;
            }

            continue;
        }


        // =========================================
        // REQUIRED TEXT / SELECT / OTHER FIELDS
        // =========================================

        if (
            !field.value ||
            !field.value.trim()
        ) {

            showMessage(
                `Please complete the required field: ${getFieldLabel(field)}.`
            );

            field.focus();

            return false;
        }

    }


    // =========================================
    // MOBILE
    // =========================================

    const mobile =
        document
            .getElementById(
                "mobile-number"
            )
            .value
            .trim();


    if (
        !/^[0-9]{10}$/.test(
            mobile
        )
    ) {

        showMessage(
            "Mobile number must contain exactly 10 digits."
        );


        document
            .getElementById(
                "mobile-number"
            )
            .focus();


        return false;

    }


    // =========================================
    // ALTERNATE MOBILE
    // =========================================

    const alternateMobile =
        document
            .getElementById(
                "alternate-mobile-number"
            )
            .value
            .trim();


    if (
        alternateMobile &&
        !/^[0-9]{10}$/.test(
            alternateMobile
        )
    ) {

        showMessage(
            "Alternate mobile number must contain exactly 10 digits."
        );


        document
            .getElementById(
                "alternate-mobile-number"
            )
            .focus();


        return false;

    }


    // =========================================
    // PINCODE
    // =========================================

    const pincode =
        document
            .getElementById(
                "student-pincode"
            )
            .value
            .trim();


    if (
        !/^[0-9]{6}$/.test(
            pincode
        )
    ) {

        showMessage(
            "Pincode must contain exactly 6 digits."
        );


        document
            .getElementById(
                "student-pincode"
            )
            .focus();


        return false;

    }


    // =========================================
    // EMAIL
    // =========================================

    const email =
        document
            .getElementById(
                "student-email"
            )
            .value
            .trim();


    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        )
    ) {

        showMessage(
            "Please enter a valid email address."
        );


        document
            .getElementById(
                "student-email"
            )
            .focus();


        return false;

    }


    // =========================================
    // DATE OF BIRTH
    // =========================================

    const dob =
        document
            .getElementById(
                "student-dob"
            )
            .value;


    if (dob) {

        const birthDate =
            new Date(dob);


        const today =
            new Date();


        if (
            birthDate > today
        ) {

            showMessage(
                "Date of birth cannot be in the future."
            );


            document
                .getElementById(
                    "student-dob"
                )
                .focus();


            return false;

        }

    }


    return true;

}


// =====================================================
// FIELD LABEL
// =====================================================

function getFieldLabel(
    field
) {

    const label =
        document.querySelector(
            `label[for="${field.id}"]`
        );


    if (label) {

        return label.textContent
            .replace("*", "")
            .trim();

    }


    return field.id;

}


// =====================================================
// COLLECT FORM DATA
// =====================================================

function collectApplicationData() {

    return {

        student_name:
            document
                .getElementById(
                    "student-name"
                )
                .value
                .trim(),


        gender:
            document
                .getElementById(
                    "student-gender"
                )
                .value
                .trim(),


        date_of_birth:
            document
                .getElementById(
                    "student-dob"
                )
                .value,


        pen_number:
            document
                .getElementById(
                    "student-pen"
                )
                .value
                .trim(),


        social_category:
            document
                .getElementById(
                    "student-category"
                )
                .value
                .trim(),


        nationality:
            document
                .getElementById(
                    "student-nationality"
                )
                .value
                .trim(),


        blood_group:
            document
                .getElementById(
                    "student-blood-group"
                )
                .value
                .trim(),


        student_photo:
            document
                .getElementById(
                    "student-photo"
                )
                .value
                .trim(),


        mother_name:
            document
                .getElementById(
                    "mother-name"
                )
                .value
                .trim(),


        father_name:
            document
                .getElementById(
                    "father-name"
                )
                .value
                .trim(),


        guardian_name:
            document
                .getElementById(
                    "guardian-name"
                )
                .value
                .trim(),


        mobile_number:
            document
                .getElementById(
                    "mobile-number"
                )
                .value
                .trim(),


        alternate_mobile_number:
            document
                .getElementById(
                    "alternate-mobile-number"
                )
                .value
                .trim(),


        email:
            document
                .getElementById(
                    "student-email"
                )
                .value
                .trim(),


        address:
            document
                .getElementById(
                    "student-address"
                )
                .value
                .trim(),


        pincode:
            document
                .getElementById(
                    "student-pincode"
                )
                .value
                .trim(),


        academic_year_id:
            academicYearSelect.value,


        class_id:
            classSelect.value,


        preferred_section_id:
            sectionSelect.value,


        previous_school_name:
            document
                .getElementById(
                    "previous-school"
                )
                .value
                .trim()

    };

}


// =====================================================
// SUBMIT APPLICATION
// =====================================================

async function submitApplication() {

    clearMessage();


    if (!validateForm()) {

        return;

    }


    const applicationData =
        collectApplicationData();


    submitButton.disabled =
        true;


    submitButton.textContent =
        "Submitting...";


    try {

        console.log(
            "Submitting parent admission application..."
        );


        const {
            data,
            error
        } = await supabase.rpc(
            "submit_admission_application",
            {
                p_application:
                    applicationData
            }
        );


        if (error) {

            console.error(
                "Application submission failed:",
                error
            );


            showMessage(
                error.message ||
                "Unable to submit application."
            );


            return;

        }


        console.log(
            "Application submitted:",
            data
        );


        // =========================================
        // SHOW SUCCESS SCREEN
        // =========================================

        applicationNumberElement.textContent =
            data;


        form.hidden =
            true;


        successScreen.hidden =
            false;


        window.scrollTo(
            {
                top: 0,
                behavior: "smooth"
            }
        );


    } catch (error) {

        console.error(
            "Unexpected submission error:",
            error
        );


        showMessage(
            "An unexpected error occurred. Please try again."
        );

    } finally {

        submitButton.disabled =
            false;


        submitButton.textContent =
            "Submit Application";

    }

}


// =====================================================
// RESET / NEW APPLICATION
// =====================================================

function resetApplicationPage() {

    form.reset();


    document
        .getElementById(
            "student-nationality"
        )
        .value =
        "Indian";


    sectionSelect.innerHTML = `
        <option value="">
            Select class first
        </option>
    `;


    clearMessage();


    form.hidden =
        false;


    successScreen.hidden =
        true;


    submitButton.disabled =
        false;


    submitButton.textContent =
        "Submit Application";


    window.scrollTo(
        {
            top: 0,
            behavior: "smooth"
        }
    );

}


// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            await submitApplication();

        }
    );


    classSelect.addEventListener(
        "change",
        async () => {

            clearMessage();


            await loadSections(
                classSelect.value
            );

        }
    );


    newApplicationButton.addEventListener(
        "click",
        resetApplicationPage
    );


    form.addEventListener(
        "reset",
        () => {

            setTimeout(
                () => {

                    sectionSelect.innerHTML = `
                        <option value="">
                            Select class first
                        </option>
                    `;

                },
                0
            );

        }
    );

}

// =====================================================
// STAFF UI MODE
// =====================================================

function setupStaffMode() {

    if (!isStaffMode) {
        return;
    }


    // =========================================
    // PAGE TITLE
    // =========================================

    const pageTitle =
        document.querySelector(
            ".admission-header h1"
        );

    if (pageTitle) {

        pageTitle.textContent =
            "New Admission Application";

    }


    // =========================================
    // PAGE SUBTITLE
    // =========================================

    const pageSubtitle =
        document.querySelector(
            ".admission-header p"
        );

    if (pageSubtitle) {

        pageSubtitle.textContent =
            "Enter the student's details to create an admission application for administrative review.";

    }


    // =========================================
    // SUBMIT BUTTON
    // =========================================

    if (submitButton) {

        submitButton.textContent =
            "Submit for Admin Review";

    }


    // =========================================
    // STUDENT INFORMATION DESCRIPTION
    // =========================================

    const studentDescription =
        document.querySelector(
            ".form-section:nth-of-type(1) .section-heading p"
        );

    if (studentDescription) {

        studentDescription.textContent =
            "Enter the applicant's student details.";

    }


    // =========================================
    // CONTACT DESCRIPTION
    // =========================================

    const formSections =
        document.querySelectorAll(
            ".form-section"
        );

    if (formSections.length >= 3) {

        const contactDescription =
            formSections[2]
                .querySelector(
                    ".section-heading p"
                );

        if (contactDescription) {

            contactDescription.textContent =
                "Provide the parent's or guardian's contact details.";

        }

    }


    // =========================================
    // STAFF NOTICE
    // =========================================

    const notice =
        document.createElement(
            "div"
        );

    notice.className =
        "staff-application-notice";

    notice.innerHTML = `
        <strong>Staff Submission</strong>
        <p>
            This application will be sent to Admin
            for review. The student will not be added
            to the student database until the application
            is approved.
        </p>
    `;


    const form =
        document.getElementById(
            "parent-admission-form"
        );

    if (
        form &&
        form.parentNode
    ) {

        form.parentNode.insertBefore(
            notice,
            form
        );

    }

}

function setupSuccessScreenText() {

    if (!isStaffMode) {
        return;
    }

    const successTitle =
        document.querySelector(
            "#success-screen h2"
        );

    const successMessage =
        document.querySelector(
            "#success-screen > p"
        );

    const successNote =
        document.querySelector(
            ".success-note"
        );


    if (successTitle) {

        successTitle.textContent =
            "Application Submitted for Admin Review";

    }


    if (successMessage) {

        successMessage.textContent =
            "The admission application has been successfully submitted and is now pending Admin review.";

    }


    if (successNote) {

        successNote.textContent =
            "Keep this application number for future reference.";

    }

}

// =====================================================
// INITIALIZE
// =====================================================

async function initializePage() {

    console.log(
        "Initializing parent admission page..."
    );

    try {

        setupStaffMode();

        setupSuccessScreenText();

        setupEventListeners();

        await Promise.all([
            loadAcademicYears(),
            loadClasses()
        ]);

        console.log(
            "Parent admission page ready."
        );

    } catch (error) {

        console.error(
            "Parent admission initialization failed:",
            error
        );

        showMessage(
            "Unable to initialize the admission form."
        );

    }

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);