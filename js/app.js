// School Portal - Frontend JavaScript

function showPage(pageId, element) {

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Remove active menu state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Activate selected menu
    if (element) {
        element.classList.add('active');
    }
}


// Handle sidebar navigation without inline JavaScript in HTML
document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.nav-item[data-page]').forEach(item => {

        item.addEventListener('click', () => {

            showPage(item.dataset.page, item);

        });

    });

});