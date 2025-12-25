(() => {
  "use strict";

  function validateRange(qid, label, field, value, min, max, errors, fieldLabel) {
    if (value !== null && value !== undefined) {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < min || numValue > max) {
        errors.push({
          question_id: qid,
          question_label: label,
          field: field,
          message: `${fieldLabel} muss zwischen ${min} und ${max} liegen`,
          type: "range_error",
        });
      }
    }
  }

  function validateScale(qid, respData, label, errors) {
    const value = respData.value;
    if (value !== null && value !== undefined) {
      validateRange(qid, label, "value", value, 0, 10, errors, "Wert");
    }
  }

  function validateConsentRating(qid, respData, label, riskLevel, errors, warnings) {
    const hasDomSub = respData.dom_status || respData.sub_status;
    const hasActivePassive = respData.active_status || respData.passive_status;

    if (hasDomSub) {
      const domStatus = respData.dom_status;
      const subStatus = respData.sub_status;
      const conditions = (respData.conditions || "").trim();

      if (domStatus === "MAYBE" && !conditions) {
        errors.push({
          question_id: qid,
          question_label: label,
          field: "dom_conditions",
          message: "Dom Status 'VIELLEICHT' erfordert Bedingungen",
          type: "missing_required",
        });
      }
      if (subStatus === "MAYBE" && !conditions) {
        errors.push({
          question_id: qid,
          question_label: label,
          field: "sub_conditions",
          message: "Sub Status 'VIELLEICHT' erfordert Bedingungen",
          type: "missing_required",
        });
      }

      for (const variant of ["dom", "sub"]) {
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
            type: "low_comfort_high_interest",
          });
        }
      }
    } else if (hasActivePassive) {
      const activeStatus = respData.active_status;
      const passiveStatus = respData.passive_status;
      const conditions = (respData.conditions || "").trim();

      if (activeStatus === "MAYBE" && !conditions) {
        errors.push({
          question_id: qid,
          question_label: label,
          field: "active_conditions",
          message: "Aktiv Status 'VIELLEICHT' erfordert Bedingungen",
          type: "missing_required",
        });
      }
      if (passiveStatus === "MAYBE" && !conditions) {
        errors.push({
          question_id: qid,
          question_label: label,
          field: "passive_conditions",
          message: "Passiv Status 'VIELLEICHT' erfordert Bedingungen",
          type: "missing_required",
        });
      }

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
            type: "low_comfort_high_interest",
          });
        }
      }
    } else {
      const status = respData.status;
      const conditions = (respData.conditions || "").trim();
      const interest = respData.interest;
      const comfort = respData.comfort;

      if (status === "MAYBE" && !conditions) {
        errors.push({
          question_id: qid,
          question_label: label,
          field: "conditions",
          message: "Bei Status 'VIELLEICHT' müssen Bedingungen angegeben werden",
          type: "missing_required",
        });
      }

      validateRange(qid, label, "interest", interest, 0, 4, errors, "Interesse");
      validateRange(qid, label, "comfort", comfort, 0, 4, errors, "Komfort");

      if (interest >= 3 && comfort <= 2) {
        warnings.push({
          question_id: qid,
          question_label: label,
          field: "interest",
          message: `Hohes Interesse (${interest}) aber niedriger Komfort (${comfort})`,
          type: "low_comfort_high_interest",
        });
      }

      if (riskLevel === "C" && status === "YES" && !conditions) {
        warnings.push({
          question_id: qid,
          question_label: label,
          field: "conditions",
          message: "High-Risk Frage: Bitte Bedingungen für Sicherheit notieren",
          type: "high_risk_missing_conditions",
        });
      }
    }
  }

  function validateResponses(template, responses) {
    const errors = [];
    const warnings = [];

    if (!template || !template.modules) {
      return { errors, warnings };
    }

    const questionMap = {};
    for (const mod of template.modules || []) {
      for (const q of mod.questions || []) {
        questionMap[q.id] = q;
      }
    }

    for (const [qid, respData] of Object.entries(responses || {})) {
      if (!respData || typeof respData !== "object") continue;

      const question = questionMap[qid];
      if (!question) {
        warnings.push({
          question_id: qid,
          question_label: qid,
          field: null,
          message: "Unbekannte Frage-ID (kann von anderer Template-Version sein)",
          type: "unknown_question",
        });
        continue;
      }

      const schema = question.schema;
      const riskLevel = question.risk_level || "A";
      const label = question.label || qid;

      if (schema === "consent_rating") {
        validateConsentRating(qid, respData, label, riskLevel, errors, warnings);
      } else if (schema === "scale_0_10") {
        validateScale(qid, respData, label, errors);
      }
    }

    return { errors, warnings };
  }

  window.CoreValidation = { validateResponses };
})();

