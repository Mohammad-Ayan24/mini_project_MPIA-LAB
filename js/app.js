import {
checkAuthSession,
getCurrentProfile
} from "./auth.js";

import { supabase } from "./supabase.js";

// =====================================================
// GLOBAL PORTAL STATE
// =====================================================

let currentProfile = null;

let admissionApplications = [];

let currentReviewApplication = null;

// =====================================================
// STUDENT FILTER STATE
// =====================================================

let allStudents = [];

// =====================================================
// SIDEBAR / PAGE NAVIGATION
// =====================================================

function showPage(pageId, element) {

document
    .querySelectorAll(".page-section")
    .forEach(page => {

        page.classList.remove("active");

    });


const selectedPage =
    document.getElementById(pageId);


if (selectedPage) {

    selectedPage.classList.add("active");

}


document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        item.classList.remove("active");

    });


if (element) {

    element.classList.add("active");

}

}

// =====================================================
// SIDEBAR NAVIGATION
// =====================================================

function setupSidebarNavigation() {

const navItems =
    document.querySelectorAll(
        ".nav-item[data-page]"
    );


navItems.forEach(item => {

    item.addEventListener(
        "click",
        async () => {

            const pageId =
                item.dataset.page;


            showPage(
                pageId,
                item
            );


            if (
                pageId === "admissions"
            ) {

                await loadAdmissionApplications();

            }

        }
    );

});

}

// =====================================================
// UPDATE USER INFORMATION
// =====================================================

function updateUserInterface() {

if (!currentProfile) {

    return;

}


const userName =
    document.querySelector(
        ".user strong"
    );


const userRole =
    document.querySelector(
        ".user small"
    );


const avatar =
    document.querySelector(
        ".avatar"
    );


if (userName) {

    userName.textContent =
        currentProfile.full_name ||
        "User";

}


if (userRole) {

    userRole.textContent =
        currentProfile.role === "admin"
            ? "Administrator"
            : "Staff";

}


if (avatar) {

    const name =
        currentProfile.full_name ||
        "User";


    avatar.textContent =
        name
            .charAt(0)
            .toUpperCase();

}

}

// =====================================================
// ROLE-BASED UI
// =====================================================

function updateRoleBasedUI() {

if (!currentProfile) {

    return;

}


const adminOnlyItems =
    document.querySelectorAll(
        '[data-admin-only="true"]'
    );


adminOnlyItems.forEach(item => {

    if (
        currentProfile.role ===
        "admin"
    ) {

        item.style.display = "";

    } else {

        item.style.display = "none";

    }

});

}

// =====================================================
// LOGOUT BUTTON
// =====================================================

function createLogoutButton() {

const userContainer =
    document.querySelector(
        ".user"
    );


if (!userContainer) {

    return;

}


if (
    document.getElementById(
        "logout-button"
    )
) {

    return;

}


const logoutButton =
    document.createElement(
        "button"
    );


logoutButton.id =
    "logout-button";


logoutButton.type =
    "button";


logoutButton.textContent =
    "Logout";


logoutButton.className =
    "logout-button";


logoutButton.style.marginLeft =
    "12px";

logoutButton.style.padding =
    "8px 12px";

logoutButton.style.border =
    "1px solid #d1d5db";

logoutButton.style.borderRadius =
    "7px";

logoutButton.style.background =
    "#ffffff";

logoutButton.style.color =
    "#374151";

logoutButton.style.cursor =
    "pointer";

logoutButton.style.fontSize =
    "13px";


userContainer.appendChild(
    logoutButton
);


logoutButton.addEventListener(
    "click",
    handleLogout
);

}

// =====================================================
// LOGOUT
// =====================================================

async function handleLogout() {

const logoutButton =
    document.getElementById(
        "logout-button"
    );


if (!logoutButton) {

    return;

}


logoutButton.disabled =
    true;


logoutButton.textContent =
    "Logging out...";


try {

    const { error } =
        await supabase.auth.signOut();


    if (error) {

        console.error(
            "Logout failed:",
            error
        );


        logoutButton.disabled =
            false;


        logoutButton.textContent =
            "Logout";


        return;

    }


    currentProfile = null;


    window.location.href =
        "login.html";


} catch (error) {

    console.error(
        "Logout error:",
        error
    );


    logoutButton.disabled =
        false;


    logoutButton.textContent =
        "Logout";

}

}

// =====================================================
// ADD STUDENT BUTTONS
// =====================================================

function setupAddStudentButtons() {

const buttons =
    document.querySelectorAll(
        "button"
    );


buttons.forEach(button => {

    const buttonText =
        button.textContent
            .trim()
            .toLowerCase();


    if (
        buttonText.includes(
            "add student"
        )
    ) {

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    "admission.html";

            }
        );

    }

});

}

// =====================================================
// LOAD STUDENTS
// =====================================================

async function loadStudents() {

const tableBody =
    document.getElementById(
        "students-table-body"
    );


if (!tableBody) {

    return;

}


tableBody.innerHTML = `
    <tr>
        <td colspan="7">
            Loading students...
        </td>
    </tr>
`;


try {

    const {
        data,
        error
    } = await supabase
        .from("students")
        .select(`
            admission_number,
            student_name,
            gender,
            date_of_birth,
            mobile_number,
            student_status,

            student_enrollments (
                admission_date,
                academic_year_id,

                classes (
                    id,
                    name
                ),

                sections (
                    id,
                    name
                ),

                academic_years (
                    name,
                    is_current
                )
            )
        `)
        .order(
            "student_name",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Failed to load students:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load students.
                </td>
            </tr>
        `;


        return;

    }

    allStudents = data || [];

    if (
        !data ||
        data.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No students found.
                </td>
            </tr>
        `;


        return;

    }


    renderStudents(
        allStudents
    );


} catch (error) {

    console.error(
        "Unexpected student loading error:",
        error
    );


    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                Unable to load students.
            </td>
        </tr>
    `;

}

}

// =====================================================
// RENDER STUDENTS
// =====================================================

function renderStudents(
students
) {

const tableBody =
    document.getElementById(
        "students-table-body"
    );


if (!tableBody) {
    return;
}


if (
    !students ||
    students.length === 0
) {

    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                No students found.
            </td>
        </tr>
    `;

    return;

}


tableBody.innerHTML = "";


students.forEach(student => {

    const enrollments =
        student.student_enrollments ||
        [];


    const currentEnrollment =
        enrollments.find(
            enrollment =>
                enrollment
                    .academic_years
                    ?.is_current === true
        )
        ||
        enrollments[0];


    const className =
        currentEnrollment
            ?.classes
            ?.name
        ||
        "-";


    const sectionName =
        currentEnrollment
            ?.sections
            ?.name
        ||
        "-";


    const studentName =
        student.student_name ||
        "-";


    const firstLetter =
        studentName
            .charAt(0)
            .toUpperCase();


    const studentRow =
        document.createElement(
            "tr"
        );


    studentRow.style.cursor =
        "pointer";


    studentRow.title =
        "Click to view student profile";


    studentRow.addEventListener(
        "click",
        () => {

            if (
                student.admission_number
            ) {

                window.open(
                    `student-profile.html?admission=${encodeURIComponent(
                        student.admission_number
                    )}`,
                    "_blank"
                );

            }

        }
    );


    studentRow.innerHTML = `

        <td>

            <div class="student">

                <div class="student-img">
                    ${escapeHtml(firstLetter)}
                </div>

                ${escapeHtml(studentName)}

            </div>

        </td>


        <td>
            ${escapeHtml(
        student.admission_number ||
        "-"
    )}
        </td>


        <td>
            ${escapeHtml(
        student.date_of_birth ||
        "-"
    )}
        </td>


        <td>
            ${escapeHtml(
        student.gender ||
        "-"
    )}
        </td>


        <td>
            ${className !== "-" &&
            sectionName !== "-"
            ? `${escapeHtml(className)}-${escapeHtml(sectionName)}`
            : escapeHtml(className)
        }
        </td>


        <td>
            ${escapeHtml(
            student.mobile_number ||
            "-"
        )}
        </td>


        <td>

            <span
                class="badge ${student.student_status ===
            "Active"
            ? "green-badge"
            : "yellow-badge"
        }"
            >

                ${escapeHtml(
            student.student_status ||
            "-"
        )}

            </span>

        </td>

    `;


    tableBody.appendChild(
        studentRow
    );

});

}

// =====================================================
// STUDENT FILTERS
// =====================================================

function setupStudentFilters() {

const searchInput =
    document.getElementById(
        "student-search"
    );


const classSelect =
    document.getElementById(
        "student-class-filter"
    );


const sectionSelect =
    document.getElementById(
        "student-section-filter"
    );


const statusSelect =
    document.getElementById(
        "student-status-filter"
    );



const resetButton =
    document.getElementById(
        "student-reset-button"
    );


if (
    !searchInput ||
    !classSelect ||
    !sectionSelect ||
    !statusSelect
) {

    return;

}


// =========================================
// SEARCH
// =========================================

searchInput.addEventListener(
    "input",
    applyStudentFilters
);


// =========================================
// DROPDOWNS
// =========================================

classSelect.addEventListener(
    "change",
    () => {

        updateStudentSectionFilter();

    }
);


sectionSelect.addEventListener(
    "change",
    applyStudentFilters
);


statusSelect.addEventListener(
    "change",
    applyStudentFilters
);


// =========================================
// RESET
// =========================================

if (resetButton) {

    resetButton.addEventListener(
        "click",
        resetStudentFilters
    );

}


// =========================================
// LOAD CLASS FILTER
// =========================================

loadStudentFilterOptions();

}

// =====================================================
// LOAD STUDENT FILTER OPTIONS
// =====================================================

async function loadStudentFilterOptions() {

const classSelect =
    document.getElementById(
        "student-class-filter"
    );


const sectionSelect =
    document.getElementById(
        "student-section-filter"
    );


if (
    !classSelect ||
    !sectionSelect
) {

    return;

}


try {

    const {
        data: classes,
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
            "Failed to load student filter classes:",
            error
        );

        return;

    }


    classSelect.innerHTML = `

        <option value="all">
            All Classes
        </option>

    `;


    (classes || []).forEach(
        classItem => {

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

        }
    );


    updateStudentSectionFilter();


} catch (error) {

    console.error(
        "Unexpected student filter error:",
        error
    );

}

}


// =====================================================
// UPDATE SECTION FILTER
// =====================================================

async function updateStudentSectionFilter() {

const classSelect =
    document.getElementById(
        "student-class-filter"
    );


const sectionSelect =
    document.getElementById(
        "student-section-filter"
    );


if (
    !classSelect ||
    !sectionSelect
) {

    return;

}


const classId =
    classSelect.value;


sectionSelect.innerHTML = `

    <option value="all">
        All Sections
    </option>

`;


if (
    !classId ||
    classId === "all"
) {

    applyStudentFilters();

    return;

}


try {

    const {
        data: sections,
        error
    } = await supabase
        .from("sections")
        .select(
            "id, name, class_id"
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
            "Failed to load student sections:",
            error
        );

        return;

    }


    (sections || []).forEach(
        section => {

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

        }
    );


    applyStudentFilters();


} catch (error) {

    console.error(
        "Unexpected section filter error:",
        error
    );

}

}

// =====================================================
// APPLY STUDENT FILTERS
// =====================================================

function applyStudentFilters() {

const searchInput =
    document.getElementById(
        "student-search"
    );


const classSelect =
    document.getElementById(
        "student-class-filter"
    );


const sectionSelect =
    document.getElementById(
        "student-section-filter"
    );


const statusSelect =
    document.getElementById(
        "student-status-filter"
    );


if (!searchInput) {
    return;
}


const search =
    searchInput.value
        .trim()
        .toLowerCase();


const selectedClass =
    classSelect?.value ||
    "all";


const selectedSection =
    sectionSelect?.value ||
    "all";


const selectedStatus =
    statusSelect?.value ||
    "all";


const filteredStudents =
    allStudents.filter(
        student => {

            const enrollments =
                student.student_enrollments ||
                [];


            const currentEnrollment =
                enrollments.find(
                    enrollment =>
                        enrollment
                            .academic_years
                            ?.is_current === true
                )
                ||
                enrollments[0];


            const classId =
                currentEnrollment
                    ?.classes
                    ?.id
                ||
                currentEnrollment
                    ?.class_id
                ||
                "";


            const sectionId =
                currentEnrollment
                    ?.sections
                    ?.id
                ||
                currentEnrollment
                    ?.section_id
                ||
                "";


            const className =
                currentEnrollment
                    ?.classes
                    ?.name
                ||
                "";


            const sectionName =
                currentEnrollment
                    ?.sections
                    ?.name
                ||
                "";


            const studentName =
                (
                    student.student_name ||
                    ""
                ).toLowerCase();


            const admissionNumber =
                (
                    student.admission_number ||
                    ""
                ).toLowerCase();


            const mobileNumber =
                (
                    student.mobile_number ||
                    ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                studentName.includes(
                    search
                ) ||
                admissionNumber.includes(
                    search
                ) ||
                mobileNumber.includes(
                    search
                );


            const matchesClass =
                selectedClass === "all" ||
                classId === selectedClass;


            const matchesSection =
                selectedSection === "all" ||
                sectionId === selectedSection;


            const matchesStatus =
                selectedStatus === "all" ||
                student.student_status ===
                    selectedStatus;


            return (
                matchesSearch &&
                matchesClass &&
                matchesSection &&
                matchesStatus
            );

        }
    );


renderStudents(
    filteredStudents
);

}

// =====================================================
// RESET STUDENT FILTERS
// =====================================================

function resetStudentFilters() {

    const searchInput =
        document.getElementById(
            "student-search"
        );

    const classSelect =
        document.getElementById(
            "student-class-filter"
        );

    const sectionSelect =
        document.getElementById(
            "student-section-filter"
        );

    const statusSelect =
        document.getElementById(
            "student-status-filter"
        );


    if (searchInput) {

        searchInput.value = "";

    }


    if (classSelect) {

        classSelect.value = "all";

    }


    if (sectionSelect) {

        sectionSelect.innerHTML = `

            <option value="all">
                All Sections
            </option>

        `;

    }


    if (statusSelect) {

        statusSelect.value = "all";

    }


    renderStudents(
        allStudents
    );

}

// =====================================================
// ADMISSION TABLE
// =====================================================

function getAdmissionTableBody() {

const admissionsSection =
    document.getElementById(
        "admissions"
    );


if (!admissionsSection) {

    return null;

}


return admissionsSection.querySelector(
    "tbody"
);

}

// =====================================================
// ADMISSION STATUS FILTER
// =====================================================

function setupAdmissionStatusFilter() {

const admissionsSection =
    document.getElementById(
        "admissions"
    );


if (!admissionsSection) {

    return;

}


const statusSelect =
    admissionsSection.querySelector(
        "select"
    );


if (!statusSelect) {

    return;

}


statusSelect.innerHTML = `

    <option value="all">
        All Status
    </option>

    <option value="Pending">
        Pending
    </option>

    <option value="Approved">
        Approved
    </option>

    <option value="Rejected">
        Rejected
    </option>

`;

}

// =====================================================
// LOAD ADMISSION APPLICATIONS
// =====================================================

async function loadAdmissionApplications() {

const tableBody =
    getAdmissionTableBody();


if (!tableBody) {
    return;
}


tableBody.innerHTML = `
    <tr>
        <td colspan="6">
            Loading applications...
        </td>
    </tr>
`;


try {

    // =========================================
    // LOAD APPLICATIONS
    // =========================================

    const {
        data: applications,
        error: applicationsError
    } = await supabase
        .from("admission_applications")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (applicationsError) {

        console.error(
            "Failed to load admission applications:",
            applicationsError
        );


        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load admission applications.
                </td>
            </tr>
        `;


        return;
    }


    if (
        !applications ||
        applications.length === 0
    ) {

        admissionApplications = [];

        renderAdmissionApplications([]);

        return;
    }


    // =========================================
    // GET UNIQUE IDs
    // =========================================

    const academicYearIds =
        [
            ...new Set(
                applications
                    .map(
                        application =>
                            application.academic_year_id
                    )
                    .filter(Boolean)
            )
        ];


    const classIds =
        [
            ...new Set(
                applications
                    .map(
                        application =>
                            application.class_id
                    )
                    .filter(Boolean)
            )
        ];


    const sectionIds =
        [
            ...new Set(
                applications
                    .map(
                        application =>
                            application.preferred_section_id
                    )
                    .filter(Boolean)
            )
        ];


    // =========================================
    // LOAD ACADEMIC YEARS
    // =========================================

    let academicYears = [];


    if (
        academicYearIds.length > 0
    ) {

        const {
            data,
            error
        } = await supabase
            .from("academic_years")
            .select(
                "id, name"
            )
            .in(
                "id",
                academicYearIds
            );


        if (error) {

            console.error(
                "Failed to load academic years:",
                error
            );

        } else {

            academicYears =
                data || [];

        }

    }


    // =========================================
    // LOAD CLASSES
    // =========================================

    let classes = [];


    if (
        classIds.length > 0
    ) {

        const {
            data,
            error
        } = await supabase
            .from("classes")
            .select(
                "id, name"
            )
            .in(
                "id",
                classIds
            );


        if (error) {

            console.error(
                "Failed to load classes:",
                error
            );

        } else {

            classes =
                data || [];

        }

    }


    // =========================================
    // LOAD SECTIONS
    // =========================================

    let sections = [];


    if (
        sectionIds.length > 0
    ) {

        const {
            data,
            error
        } = await supabase
            .from("sections")
            .select(
                "id, name, class_id"
            )
            .in(
                "id",
                sectionIds
            );


        if (error) {

            console.error(
                "Failed to load sections:",
                error
            );

        } else {

            sections =
                data || [];

        }

    }


    // =========================================
    // CREATE LOOKUP MAPS
    // =========================================

    const academicYearMap =
        new Map(
            academicYears.map(
                year => [
                    year.id,
                    year.name
                ]
            )
        );


    const classMap =
        new Map(
            classes.map(
                classItem => [
                    classItem.id,
                    classItem.name
                ]
            )
        );


    const sectionMap =
        new Map(
            sections.map(
                section => [
                    section.id,
                    section.name
                ]
            )
        );


    // =========================================
    // ATTACH DISPLAY NAMES
    // =========================================

    admissionApplications =
        applications.map(
            application => {

                return {

                    ...application,

                    academic_year_name:
                        academicYearMap.get(
                            application
                                .academic_year_id
                        ) || "-",

                    applying_class_name:
                        classMap.get(
                            application
                                .class_id
                        ) || "-",

                    preferred_section_name:
                        sectionMap.get(
                            application
                                .preferred_section_id
                        ) || "-"

                };

            }
        );


    console.log(
        "Admission applications with related data:",
        admissionApplications
    );


    // =========================================
    // DISPLAY
    // =========================================

    renderAdmissionApplications(
        admissionApplications
    );


} catch (error) {

    console.error(
        "Unexpected admission loading error:",
        error
    );


    tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                Unable to load admission applications.
            </td>
        </tr>
    `;

}

}

// =====================================================
// RENDER ADMISSION APPLICATIONS
// =====================================================

function renderAdmissionApplications(
applications
) {

const tableBody =
    getAdmissionTableBody();


if (!tableBody) {

    return;

}


if (
    !applications ||
    applications.length === 0
) {

    tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                No applications yet
            </td>
        </tr>
    `;


    return;

}


tableBody.innerHTML =
    "";


applications.forEach(
    application => {

        const row =
            document.createElement(
                "tr"
            );


        row.style.cursor =
            "pointer";


        row.title =
            "Click to review application";


        const submittedDate =
            application.created_at
                ? new Date(
                    application.created_at
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                )
                : "-";


        const className =
            application.applying_class_name ||
            application.class_name ||
            "-";


        const sectionName =
            application.preferred_section_name ||
            application.section_name ||
            "";


        const applyingClass =
            sectionName
                ? `${className}-${sectionName}`
                : className;


        const parentName =
            application.father_name ||
            application.mother_name ||
            "-";


        const status =
            application.status ||
            "Pending";


        const statusClass =
            getAdmissionStatusClass(
                status
            );


        row.innerHTML = `

            <td>
                ${escapeHtml(
            application.application_number ||
            "-"
        )}
            </td>

            <td>
                ${escapeHtml(
            application.student_name ||
            "-"
        )}
            </td>

            <td>
                ${escapeHtml(
            applyingClass
        )}
            </td>

            <td>
                ${escapeHtml(
            parentName
        )}
            </td>

            <td>
                ${submittedDate}
            </td>

            <td>

                <span class="badge ${statusClass}">
                    ${escapeHtml(status)}
                </span>

            </td>

        `;


        row.addEventListener(
            "click",
            () => {

                openAdmissionReview(
                    application
                );

            }
        );


        tableBody.appendChild(
            row
        );

    }
);

}

// =====================================================
// STATUS BADGE
// =====================================================

function getAdmissionStatusClass(
status
) {

if (!status) {

    return "yellow-badge";

}


switch (
status.toLowerCase()
) {

    case "approved":

        return "green-badge";


    case "rejected":

        return "yellow-badge";


    case "pending":

        return "yellow-badge";


    default:

        return "yellow-badge";

}

}

// =====================================================
// ADMISSION FILTERS
// =====================================================

function setupAdmissionFilters() {

const admissionsSection =
    document.getElementById(
        "admissions"
    );


if (!admissionsSection) {

    return;

}


const searchInput =
    admissionsSection.querySelector(
        'input[type="text"]'
    );


const statusSelect =
    admissionsSection.querySelector(
        "select"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        applyAdmissionFilters
    );

}


if (statusSelect) {

    statusSelect.addEventListener(
        "change",
        applyAdmissionFilters
    );

}

}

function applyAdmissionFilters() {

const admissionsSection =
    document.getElementById(
        "admissions"
    );


if (!admissionsSection) {

    return;

}


const searchInput =
    admissionsSection.querySelector(
        'input[type="text"]'
    );


const statusSelect =
    admissionsSection.querySelector(
        "select"
    );


const search =
    searchInput
        ?.value
        .trim()
        .toLowerCase()
    ||
    "";


const selectedStatus =
    statusSelect
        ?.value
    ||
    "all";


const filteredApplications =
    admissionApplications.filter(
        application => {

            const applicationNumber =
                (
                    application
                        .application_number
                    ||
                    ""
                )
                    .toLowerCase();


            const studentName =
                (
                    application
                        .student_name
                    ||
                    ""
                )
                    .toLowerCase();


            const fatherName =
                (
                    application
                        .father_name
                    ||
                    ""
                )
                    .toLowerCase();


            const motherName =
                (
                    application
                        .mother_name
                    ||
                    ""
                )
                    .toLowerCase();


            const mobileNumber =
                (
                    application
                        .mobile_number
                    ||
                    ""
                )
                    .toLowerCase();


            const matchesSearch =
                !search ||
                applicationNumber.includes(
                    search
                ) ||
                studentName.includes(
                    search
                ) ||
                fatherName.includes(
                    search
                ) ||
                motherName.includes(
                    search
                ) ||
                mobileNumber.includes(
                    search
                );


            const matchesStatus =
                selectedStatus === "all"
                ||
                application.status ===
                selectedStatus;


            return (
                matchesSearch &&
                matchesStatus
            );

        }
    );


renderAdmissionApplications(
    filteredApplications
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
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

// =====================================================
// FORMAT VALUE
// =====================================================

function displayValue(
value
) {

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
// REVIEW MODAL STYLES
// =====================================================

function injectReviewModalStyles() {

if (
    document.getElementById(
        "admission-review-styles"
    )
) {

    return;

}


const style =
    document.createElement(
        "style"
    );


style.id =
    "admission-review-styles";


style.textContent = `

    .admission-review-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(15, 23, 42, 0.55);
    }


    .admission-review-modal.open {
        display: flex;
    }


    .admission-review-dialog {
        width: min(900px, 100%);
        max-height: 90vh;
        overflow-y: auto;
        background: #ffffff;
        border-radius: 14px;
        box-shadow:
            0 20px 60px
            rgba(0, 0, 0, 0.2);
    }


    .admission-review-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        padding: 24px 28px;
        border-bottom: 1px solid #e5e7eb;
    }


    .admission-review-header h2 {
        margin: 0 0 6px;
        font-size: 21px;
    }


    .admission-review-header p {
        margin: 0;
        color: #6b7280;
        font-size: 13px;
    }


    .admission-review-close {
        width: 34px;
        height: 34px;
        border: 0;
        border-radius: 7px;
        background: #f3f4f6;
        color: #374151;
        font-size: 20px;
        cursor: pointer;
    }


    .admission-review-close:hover {
        background: #e5e7eb;
    }


    .admission-review-body {
        padding: 26px 28px;
    }


    .review-status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        margin-bottom: 24px;
        padding: 14px 16px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
    }


    .review-section {
        margin-bottom: 28px;
    }


    .review-section:last-child {
        margin-bottom: 0;
    }


    .review-section h3 {
        margin: 0 0 14px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 16px;
    }


    .review-grid {
        display: grid;
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
        gap: 15px 24px;
    }


    .review-field {
        min-width: 0;
    }


    .review-field.full {
        grid-column: 1 / -1;
    }


    .review-field-label {
        display: block;
        margin-bottom: 4px;
        color: #6b7280;
        font-size: 12px;
        font-weight: 600;
    }


    .review-field-value {
        color: #111827;
        font-size: 14px;
        word-break: break-word;
        line-height: 1.5;
    }


    .admission-review-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 18px 28px;
        border-top: 1px solid #e5e7eb;
    }


    .review-action-button {
        border: 0;
        border-radius: 7px;
        padding: 10px 18px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
    }


    .review-close-button {
        background: #ffffff;
        color: #374151;
        border: 1px solid #d1d5db;
    }


    .review-close-button:hover {
        background: #f9fafb;
    }


    .review-approve-button {
        background: #16a34a;
        color: #ffffff;
    }


    .review-approve-button:disabled {
        background: #86efac;
        cursor: not-allowed;
    }


    .review-reject-button {
        background: #dc2626;
        color: #ffffff;
    }


    .review-reject-button:disabled {
        background: #fca5a5;
        cursor: not-allowed;
    }


    @media (max-width: 650px) {

        .admission-review-modal {
            padding: 10px;
        }


        .admission-review-dialog {
            max-height: 95vh;
        }


        .admission-review-header,
        .admission-review-body {
            padding: 20px;
        }


        .admission-review-footer {
            padding: 15px 20px;
            flex-wrap: wrap;
        }


        .review-grid {
            grid-template-columns: 1fr;
        }


        .review-field.full {
            grid-column: auto;
        }

        .review-assignment-select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 7px;
        background: #ffffff;
        color: #111827;
        font-size: 14px;
        outline: none;
    }


    .review-assignment-select:focus {
        border-color: #2563eb;
        box-shadow:
            0 0 0 3px
            rgba(37, 99, 235, 0.1);
    }

    }

`;


document.head.appendChild(
    style
);

}

// =====================================================
// CREATE REVIEW MODAL
// =====================================================

function createReviewModal() {

if (
    document.getElementById(
        "admission-review-modal"
    )
) {

    return;

}


const modal =
    document.createElement(
        "div"
    );


modal.id =
    "admission-review-modal";


modal.className =
    "admission-review-modal";


modal.innerHTML = `

    <div
        class="admission-review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admission-review-title"
    >

        <div class="admission-review-header">

            <div>

                <h2 id="admission-review-title">
                    Admission Application
                </h2>

                <p id="admission-review-number">
                    -
                </p>

            </div>


            <button
                type="button"
                class="admission-review-close"
                id="review-close-top"
                aria-label="Close"
            >
                ×
            </button>

        </div>


        <div
            class="admission-review-body"
            id="admission-review-body"
        >

            Loading...

        </div>


        <div class="admission-review-footer">

            <button
                type="button"
                class="review-action-button review-close-button"
                id="review-close-bottom"
            >
                Close
            </button>


            <button
                type="button"
                class="review-action-button review-reject-button"
                id="review-reject-button"
            >
                Reject
            </button>


            <button
                type="button"
                class="review-action-button review-approve-button"
                id="review-approve-button"
            >
                Approve
            </button>

        </div>

    </div>

`;


document.body.appendChild(
    modal
);


document
    .getElementById(
        "review-close-top"
    )
    .addEventListener(
        "click",
        closeAdmissionReview
    );


document
    .getElementById(
        "review-close-bottom"
    )
    .addEventListener(
        "click",
        closeAdmissionReview
    );


document
    .getElementById(
        "review-approve-button"
    )
    .addEventListener(
        "click",
        approveCurrentApplication
    );


document
    .getElementById(
        "review-reject-button"
    )
    .addEventListener(
        "click",
        rejectCurrentApplication
    );

modal.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {

            closeAdmissionReview();

        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeAdmissionReview();

        }

    }
);

}

// =====================================================
// OPEN ADMISSION REVIEW
// =====================================================

async function openAdmissionReview(
application
) {
currentReviewApplication = application;

injectReviewModalStyles();

createReviewModal();


const modal =
    document.getElementById(
        "admission-review-modal"
    );


const title =
    document.getElementById(
        "admission-review-title"
    );


const number =
    document.getElementById(
        "admission-review-number"
    );


const body =
    document.getElementById(
        "admission-review-body"
    );


const approveButton =
    document.getElementById(
        "review-approve-button"
    );


const rejectButton =
    document.getElementById(
        "review-reject-button"
    );


const status =
    application.status ||
    "Pending";


const submittedDate =
    application.created_at
        ? new Date(
            application.created_at
        ).toLocaleString(
            "en-IN"
        )
        : "-";


const updatedDate =
    application.updated_at
        ? new Date(
            application.updated_at
        ).toLocaleString(
            "en-IN"
        )
        : "-";


title.textContent =
    "Admission Application";


number.textContent =
    application.application_number ||
    "-";


// =========================================
// APPLICATION DETAILS
// =========================================

body.innerHTML = `

    <div class="review-status-row">

        <strong>
            Application Status
        </strong>

        <span class="badge ${getAdmissionStatusClass(
    status
)
    }">
            ${escapeHtml(status)}
        </span>

    </div>


    <!-- =====================================
         STUDENT INFORMATION
    ====================================== -->

    <div class="review-section">

        <h3>
            Student Information
        </h3>


        <div class="review-grid">

            ${reviewField(
        "Student Name",
        application.student_name
    )}

            ${reviewField(
        "Gender",
        application.gender
    )}

            ${reviewField(
        "Date of Birth",
        application.date_of_birth
    )}

            ${reviewField(
        "PEN Number",
        application.pen_number
    )}

            ${reviewField(
        "Social Category",
        application.social_category
    )}

            ${reviewField(
        "Nationality",
        application.nationality
    )}

            ${reviewField(
        "Blood Group",
        application.blood_group
    )}

        </div>

    </div>


    <!-- =====================================
         PARENT INFORMATION
    ====================================== -->

    <div class="review-section">

        <h3>
            Parent / Guardian Information
        </h3>


        <div class="review-grid">

            ${reviewField(
        "Father's Name",
        application.father_name
    )}

            ${reviewField(
        "Mother's Name",
        application.mother_name
    )}

            ${reviewField(
        "Guardian's Name",
        application.guardian_name
    )}

        </div>

    </div>


    <!-- =====================================
         CONTACT INFORMATION
    ====================================== -->

    <div class="review-section">

        <h3>
            Contact Information
        </h3>


        <div class="review-grid">

            ${reviewField(
        "Mobile Number",
        application.mobile_number
    )}

            ${reviewField(
        "Alternate Mobile",
        application.alternate_mobile_number
    )}

            ${reviewField(
        "Email",
        application.email
    )}

            ${reviewField(
        "Pincode",
        application.pincode
    )}

            ${reviewField(
        "Address",
        application.address,
        true
    )}

        </div>

    </div>


    <!-- =====================================
         ADMISSION ASSIGNMENT
    ====================================== -->

    <div class="review-section">

        <h3>
            Admission Assignment
        </h3>


        <div class="review-grid">

            <div class="review-field">

                <span class="review-field-label">
                    Academic Year
                </span>


                <select
                    id="review-academic-year"
                    class="review-assignment-select"
                >

                    <option value="">
                        Loading...
                    </option>

                </select>

            </div>


            <div class="review-field">

                <span class="review-field-label">
                    Class
                </span>


                <select
                    id="review-class"
                    class="review-assignment-select"
                >

                    <option value="">
                        Loading...
                    </option>

                </select>

            </div>


            <div class="review-field">

                <span class="review-field-label">
                    Section
                </span>


                <select
                    id="review-section"
                    class="review-assignment-select"
                >

                    <option value="">
                        Loading...
                    </option>

                </select>

            </div>


            ${reviewField(
        "Previous School",
        application.previous_school_name,
        true
    )}

        </div>

    </div>


    <!-- =====================================
         APPLICATION INFORMATION
    ====================================== -->

    <div class="review-section">

        <h3>
            Application Information
        </h3>


        <div class="review-grid">

            ${reviewField(
        "Submitted",
        submittedDate
    )}

            ${reviewField(
        "Last Updated",
        updatedDate
    )}

        </div>

    </div>

`;


// =========================================
// LOAD DROPDOWNS
// =========================================

await loadReviewAssignmentData(
    application
);


// =========================================
// CLASS CHANGE
// =========================================

const reviewClassSelect =
    document.getElementById(
        "review-class"
    );


if (reviewClassSelect) {

    reviewClassSelect.addEventListener(
        "change",
        async () => {

            await loadReviewSections(
                reviewClassSelect.value,
                null
            );

        }
    );

}


// =========================================
// APPROVE / REJECT VISIBILITY
// =========================================

if (
    status.toLowerCase() ===
    "pending"
) {

    approveButton.style.display =
        "";

    rejectButton.style.display =
        "";

    approveButton.disabled =
        false;

    rejectButton.disabled =
        false;

} else {

    approveButton.style.display =
        "none";

    rejectButton.style.display =
        "none";

}


// =========================================
// OPEN MODAL
// =========================================

modal.classList.add(
    "open"
);


document.body.style.overflow =
    "hidden";

}

// =====================================================
// REVIEW FIELD
// =====================================================

function reviewField(
label,
value,
fullWidth = false
) {

return `

    <div class="review-field ${fullWidth ? "full" : ""
    }">

        <span class="review-field-label">
            ${escapeHtml(label)}
        </span>

        <div class="review-field-value">
            ${displayValue(value)}
        </div>

    </div>

`;

}

// =====================================================
// CLOSE ADMISSION REVIEW
// =====================================================

function closeAdmissionReview() {

const modal =
    document.getElementById(
        "admission-review-modal"
    );


if (!modal) {

    return;

}


modal.classList.remove(
    "open"
);


document.body.style.overflow =
    "";

}

// =====================================================
// APPROVE CURRENT APPLICATION
// =====================================================

async function approveCurrentApplication() {

if (!currentReviewApplication) {

    return;

}


const academicYear =
    document.getElementById(
        "review-academic-year"
    ).value;


const classId =
    document.getElementById(
        "review-class"
    ).value;


const sectionId =
    document.getElementById(
        "review-section"
    ).value;


if (
    !academicYear ||
    !classId ||
    !sectionId
) {

    alert(
        "Please select Academic Year, Class and Section."
    );

    return;

}


const confirmed =
    confirm(
        "Are you sure you want to approve this admission?"
    );


if (!confirmed) {

    return;

}


const approveButton =
    document.getElementById(
        "review-approve-button"
    );


approveButton.disabled =
    true;


approveButton.textContent =
    "Approving...";


try {

    const {
        data,
        error
    } = await supabase.rpc(
        "approve_admission_application",
        {

            p_application_id:
                currentReviewApplication.id,

            p_academic_year_id:
                academicYear,

            p_class_id:
                classId,

            p_section_id:
                sectionId

        }
    );


    if (error) {

        console.error(
            "Approval failed:",
            error
        );


        alert(
            error.message
        );


        approveButton.disabled =
            false;


        approveButton.textContent =
            "Approve";


        return;

    }


    alert(
        `Admission approved successfully.\n\nAdmission Number: ${data}`
    );


    closeAdmissionReview();


    await loadAdmissionApplications();

    await loadStudents();


} catch (error) {

    console.error(
        "Unexpected approval error:",
        error
    );


    alert(
        "Something went wrong while approving the application."
    );


    approveButton.disabled =
        false;


    approveButton.textContent =
        "Approve";

}

}

// =====================================================
// REJECT CURRENT APPLICATION
// =====================================================

async function rejectCurrentApplication() {

if (!currentReviewApplication) {

    return;

}


const confirmed =
    confirm(
        "Are you sure you want to reject this admission?"
    );


if (!confirmed) {

    return;

}


try {

    const {
        data,
        error
    } = await supabase.rpc(
        "reject_admission_application",
        {

            p_application_id:
                currentReviewApplication.id

        }
    );


    if (error) {

        console.error(
            "Rejection failed:",
            error
        );


        alert(
            error.message ||
            "Failed to reject application."
        );


        return;

    }


    console.log(
        "Application rejected:",
        data
    );


    alert(
        "Application rejected successfully."
    );


    closeAdmissionReview();


    await loadAdmissionApplications();


} catch (error) {

    console.error(
        "Unexpected rejection error:",
        error
    );


    alert(
        "Something went wrong while rejecting the application."
    );

}

}

// =====================================================
// INITIALIZE PORTAL
// =====================================================

async function initializePortal() {

try {

    console.log(
        "Initializing school portal..."
    );


    // =========================================
    // AUTHENTICATION
    // =========================================

    const profile =
        await checkAuthSession();


    if (!profile) {

        window.location.href =
            "login.html";


        return;

    }


    // =========================================
    // SAVE PROFILE
    // =========================================

    currentProfile =
        profile;


    console.log(
        "Authenticated user:",
        currentProfile
    );


    // =========================================
    // UPDATE USER UI
    // =========================================

    updateUserInterface();


    // =========================================
    // ROLE UI
    // =========================================

    updateRoleBasedUI();


    // =========================================
    // SIDEBAR
    // =========================================

    setupSidebarNavigation();


    // =========================================
    // ADD STUDENT
    // =========================================

    setupAddStudentButtons();


    // =========================================
    // LOGOUT
    // =========================================

    createLogoutButton();


    // =========================================
    // ADMISSION FILTERS
    // =========================================

    setupAdmissionStatusFilter();

    setupAdmissionFilters();

    // =========================================
    // STUDENT FILTERS
    // =========================================

    setupStudentFilters();


    // =========================================
    // LOAD STUDENTS
    // =========================================

    await loadStudents();


    // =========================================
    // LOAD ADMISSIONS
    // =========================================

    await loadAdmissionApplications();


    // =========================================
    // AUTH COMPLETE
    // =========================================

    document.body.classList.add(
        "auth-checked"
    );


    console.log(
        "Portal initialized successfully."
    );


} catch (error) {

    console.error(
        "Portal initialization failed:",
        error
    );

}

}

// =====================================================
// START APPLICATION
// =====================================================

document.addEventListener(
"DOMContentLoaded",
initializePortal
);

// =====================================================
// LOAD ASSIGNMENT DATA FOR REVIEW
// =====================================================

async function loadReviewAssignmentData(application) {

const academicYearSelect =
    document.getElementById(
        "review-academic-year"
    );

const classSelect =
    document.getElementById(
        "review-class"
    );

const sectionSelect =
    document.getElementById(
        "review-section"
    );


if (
    !academicYearSelect ||
    !classSelect ||
    !sectionSelect
) {
    return;
}


// =========================================
// LOAD ACADEMIC YEARS
// =========================================

academicYearSelect.innerHTML = `
    <option value="">
        Loading...
    </option>
`;


const {
    data: academicYears,
    error: academicYearError
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


if (academicYearError) {

    console.error(
        "Failed to load academic years:",
        academicYearError
    );


    academicYearSelect.innerHTML = `
        <option value="">
            Unable to load
        </option>
    `;

} else {

    academicYearSelect.innerHTML = `
        <option value="">
            Select academic year
        </option>
    `;


    academicYears.forEach(year => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            year.id;


        option.textContent =
            year.name;


        if (
            year.id ===
            application.academic_year_id
        ) {

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

classSelect.innerHTML = `
    <option value="">
        Loading...
    </option>
`;


const {
    data: classes,
    error: classError
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


if (classError) {

    console.error(
        "Failed to load classes:",
        classError
    );


    classSelect.innerHTML = `
        <option value="">
            Unable to load
        </option>
    `;

} else {

    classSelect.innerHTML = `
        <option value="">
            Select class
        </option>
    `;


    classes.forEach(classItem => {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            classItem.id;


        option.textContent =
            classItem.name;


        if (
            classItem.id ===
            application.class_id
        ) {

            option.selected =
                true;

        }


        classSelect.appendChild(
            option
        );

    });

}


// =========================================
// LOAD SECTIONS
// =========================================

await loadReviewSections(
    application.class_id,
    application.preferred_section_id
);

}

// =====================================================
// LOAD REVIEW SECTIONS
// =====================================================

async function loadReviewSections(
classId,
selectedSectionId = null
) {

const sectionSelect =
    document.getElementById(
        "review-section"
    );


if (!sectionSelect) {
    return;
}


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
        Loading...
    </option>
`;


const {
    data: sections,
    error
} = await supabase
    .from("sections")
    .select(
        "id, name, class_id"
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
            Unable to load
        </option>
    `;


    return;

}


sectionSelect.innerHTML = `
    <option value="">
        Select section
    </option>
`;


sections.forEach(section => {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        section.id;


    option.textContent =
        section.name;


    if (
        section.id ===
        selectedSectionId
    ) {

        option.selected =
            true;

    }


    sectionSelect.appendChild(
        option
    );

});

}