(() => {
  "use strict";

  /**
   * Evaluates a template `depends_on` object against collected responses.
   * This logic is shared by UI visibility and should not live in UI components.
   */
  function evaluateDependency(dep, responses) {
    const t = responses?.[dep?.id];
    if (!t) return false;

    // Existing logic for values
    if (dep.values && Array.isArray(dep.values)) {
      const val = t.value || t.status || t.dom_status || t.active_status;
      return dep.values.includes(val);
    }

    // Logic for scale_1_10 conditions
    if (dep.condition) {
      const value = t.value;
      if (value === undefined || value === null) return false;

      // Parse condition: "scale_1_10 >= 5" or ">= 5"
      const match = String(dep.condition).match(/(>=|<=|>|<|==)\s*(\d+)/);
      if (match) {
        const operator = match[1];
        const threshold = parseInt(match[2], 10);
        switch (operator) {
          case ">=": return value >= threshold;
          case "<=": return value <= threshold;
          case ">": return value > threshold;
          case "<": return value < threshold;
          case "==": return value == threshold;
        }
      }
    }

    // Existing conditions logic
    if (dep.conditions) {
      const val = t.value || t.status || t.dom_status || t.active_status;
      return dep.conditions.every((c) => {
        if (c.operator === "!=" && c.value === val) return false;
        return true;
      });
    }

    return false;
  }

  window.TemplateDependencies = { evaluateDependency };
})();

