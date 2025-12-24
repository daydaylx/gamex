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
    const errors = [];
    const warnings = [];
    
    if (!template || !template.modules) {
        return { errors, warnings };
    }
    
    // Build question map
    const questionMap = {};
    for (const mod of template.modules || []) {
        for (const q of mod.questions || []) {
            questionMap[q.id] = q;
        }
    }
    
    // Validate each response
    for (const [qid, respData] of Object.entries(responses)) {
        if (!respData || typeof respData !== 'object') continue;
        
        const question = questionMap[qid];
        if (!question) {
            warnings.push({
                question_id: qid,
                question_label: qid,
                field: null,
                message: "Unbekannte Frage-ID (kann von anderer Template-Version sein)",
                type: "unknown_question"
            });
            continue;
        }
        
        const schema = question.schema;
        const riskLevel = question.risk_level || "A";
        const label = question.label || qid;
        
        if (schema === "consent_rating") {
            validateConsentRating(qid, respData, label, riskLevel, errors, warnings, question);
        } else if (schema === "scale_0_10") {
            validateScale(qid, respData, label, errors);
        }
    }
    
    return { errors, warnings };
}

/**
 * Validate consent_rating schema responses
 */
function validateConsentRating(qid, respData, label, riskLevel, errors, warnings, question) {
    const hasDomSub = respData.dom_status || respData.sub_status;
    const hasActivePassive = respData.active_status || respData.passive_status;
    
    // Dom/Sub variants
    if (hasDomSub) {
        const domStatus = respData.dom_status;
        const subStatus = respData.sub_status;
        const conditions = (respData.conditions || "").trim();
        
        // MAYBE requires conditions
        if (domStatus === "MAYBE" && !conditions) {
            errors.push({
                question_id: qid,
                question_label: label,
                field: "dom_conditions",
                message: "Dom Status 'VIELLEICHT' erfordert Bedingungen",
                type: "missing_required"
            });
        }
        if (subStatus === "MAYBE" && !conditions) {
            errors.push({
                question_id: qid,
                question_label: label,
                field: "sub_conditions",
                message: "Sub Status 'VIELLEICHT' erfordert Bedingungen",
                type: "missing_required"
            });
        }
        
        // Validate ranges for dom/sub
        for (const variant of ["dom", "sub"]) {
            const interest = respData[`${variant}_interest`];
            const comfort = respData[`${variant}_comfort`];
            
            validateRange(qid, label, `${variant}_interest`, interest, 0, 4, errors, `${variant.charAt(0).toUpperCase() + variant.slice(1)} Interesse`);
            validateRange(qid, label, `${variant}_comfort`, comfort, 0, 4, errors, `${variant.charAt(0).toUpperCase() + variant.slice(1)} Komfort`);
            
            // Low comfort high interest warning
            if (interest >= 3 && comfort <= 2) {
                warnings.push({
                    question_id: qid,
                    question_label: label,
                    field: `${variant}_interest`,
                    message: `${variant.charAt(0).toUpperCase() + variant.slice(1)}: Hohes Interesse (${interest}) aber niedriger Komfort (${comfort})`,
                    type: "low_comfort_high_interest"
                });
            }
        }
    }
    // Active/Passive variants
    else if (hasActivePassive) {
        const activeStatus = respData.active_status;
        const passiveStatus = respData.passive_status;
        const conditions = (respData.conditions || "").trim();
        
        if (activeStatus === "MAYBE" && !conditions) {
            errors.push({
                question_id: qid,
                question_label: label,
                field: "active_conditions",
                message: "Aktiv Status 'VIELLEICHT' erfordert Bedingungen",
                type: "missing_required"
            });
        }
        if (passiveStatus === "MAYBE" && !conditions) {
            errors.push({
                question_id: qid,
                question_label: label,
                field: "passive_conditions",
                message: "Passiv Status 'VIELLEICHT' erfordert Bedingungen",
                type: "missing_required"
            });
        }
        
        // Validate ranges
        for (const variant of ["active", "passive"]) {
            const interest = respData[`${variant}_interest`];
            const comfort = respData[`${variant}_comfort`];
            
            validateRange(qid, label, `${variant}_interest`, interest, 0, 4, errors, `${variant.charAt(0).toUpperCase() + variant.slice(1)} Interesse`);
            validateRange(qid, label, `${variant}_comfort`, comfort, 0, 4, errors, `${variant.charAt(0).toUpperCase() + variant.slice(1)} Komfort`);
            
            if (interest >= 3 && comfort <= 2) {
                warnings.push({
                    question_id: qid,
                    question_label: label,
                    field: `${variant}_interest`,
                    message: `${variant.charAt(0).toUpperCase() + variant.slice(1)}: Hohes Interesse (${interest}) aber niedriger Komfort (${comfort})`,
                    type: "low_comfort_high_interest"
                });
            }
        }
    }
    // Standard consent_rating
    else {
        const status = respData.status;
        const conditions = (respData.conditions || "").trim();
        const interest = respData.interest;
        const comfort = respData.comfort;
        
        // MAYBE requires conditions
        if (status === "MAYBE" && !conditions) {
            errors.push({
                question_id: qid,
                question_label: label,
                field: "conditions",
                message: "Bei Status 'VIELLEICHT' müssen Bedingungen angegeben werden",
                type: "missing_required"
            });
        }
        
        // Validate ranges
        validateRange(qid, label, "interest", interest, 0, 4, errors, "Interesse");
        validateRange(qid, label, "comfort", comfort, 0, 4, errors, "Komfort");
        
        // Low comfort high interest warning
        if (interest >= 3 && comfort <= 2) {
            warnings.push({
                question_id: qid,
                question_label: label,
                field: "interest",
                message: `Hohes Interesse (${interest}) aber niedriger Komfort (${comfort})`,
                type: "low_comfort_high_interest"
            });
        }
        
        // High-risk questions should have conditions if YES
        if (riskLevel === "C" && status === "YES" && !conditions) {
            warnings.push({
                question_id: qid,
                question_label: label,
                field: "conditions",
                message: "High-Risk Frage: Bitte Bedingungen für Sicherheit notieren",
                type: "high_risk_missing_conditions"
            });
        }
    }
}

/**
 * Validate scale_0_10 schema responses
 */
function validateScale(qid, respData, label, errors) {
    const value = respData.value;
    if (value !== null && value !== undefined) {
        validateRange(qid, label, "value", value, 0, 10, errors, "Wert");
    }
}

/**
 * Generic range validation helper
 */
function validateRange(qid, label, field, value, min, max, errors, fieldLabel) {
    if (value !== null && value !== undefined) {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < min || numValue > max) {
            errors.push({
                question_id: qid,
                question_label: label,
                field: field,
                message: `${fieldLabel} muss zwischen ${min} und ${max} liegen`,
                type: "range_error"
            });
        }
    }
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
            errorDiv.style.cssText = 'background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 8px; margin-top: 8px; font-size: 0.85rem; color: #ef4444;';
            errorDiv.innerHTML = `<strong>Fehler:</strong> ${escapeHtml(err.message)}`;
            questionEl.appendChild(errorDiv);
            questionEl.style.borderColor = '#ef4444';
        }
    });
    
    // Display warnings
    warnings.forEach(warn => {
        const questionEl = document.querySelector(`.item[data-qid="${warn.question_id}"]`);
        if (questionEl) {
            const warnDiv = document.createElement('div');
            warnDiv.className = 'validation-warning';
            warnDiv.style.cssText = 'background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 8px; margin-top: 8px; font-size: 0.85rem; color: #f59e0b;';
            warnDiv.innerHTML = `<strong>Warnung:</strong> ${escapeHtml(warn.message)}`;
            questionEl.appendChild(warnDiv);
        }
    });
}

/**
 * Clear validation displays
 */
function clearValidationDisplays() {
    document.querySelectorAll('.validation-error, .validation-warning').forEach(el => el.remove());
    document.querySelectorAll('.item[style*="border-color"]').forEach(el => {
        el.style.borderColor = '';
    });
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
