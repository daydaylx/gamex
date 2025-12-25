/**
 * Client-side validation for form responses
 * Mirrors backend validation logic for immediate feedback
 */

/**
 * Validate responses against template structure
 * @param {Object} template - The template object
 * @param {Object} responses - User responses
 * @returns {Object} { errors: Array, warnings: Array }
 */
function validateResponses(template, responses) {
    if (!window.CoreValidation || typeof window.CoreValidation.validateResponses !== "function") {
        throw new Error("CoreValidation module not loaded");
    }
    return window.CoreValidation.validateResponses(template, responses);
}

/**
 * Display validation errors/warnings in the UI
 */
function displayValidationErrors(errors, warnings) {
    // Remove existing error displays
    document.querySelectorAll('.validation-error, .validation-warning').forEach(el => el.remove());
    
    // Display errors
    errors.forEach(err => {
        const questionEl = document.querySelector(`.item[data-qid="${err.question_id}"]`);
        if (questionEl) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-error';
            errorDiv.innerHTML = `<strong>Fehler:</strong> ${escapeHtml(err.message)}`;
            questionEl.appendChild(errorDiv);
            questionEl.classList.add('has-error');
        }
    });
    
    // Display warnings
    warnings.forEach(warn => {
        const questionEl = document.querySelector(`.item[data-qid="${warn.question_id}"]`);
        if (questionEl) {
            const warnDiv = document.createElement('div');
            warnDiv.className = 'validation-warning';
            warnDiv.innerHTML = `<strong>Warnung:</strong> ${escapeHtml(warn.message)}`;
            questionEl.appendChild(warnDiv);
            questionEl.classList.add('has-warning');
        }
    });
}

/**
 * Clear validation displays
 */
function clearValidationDisplays() {
    document.querySelectorAll('.validation-error, .validation-warning').forEach(el => el.remove());
    document.querySelectorAll('.item.has-error').forEach(el => el.classList.remove('has-error'));
    document.querySelectorAll('.item.has-warning').forEach(el => el.classList.remove('has-warning'));
}

/**
 * HTML escape helper
 */
function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateResponses,
        displayValidationErrors,
        clearValidationDisplays
    };
}
