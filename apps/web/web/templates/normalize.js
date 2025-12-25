(() => {
  "use strict";

  function asList(v) {
    if (v === null || v === undefined) return [];
    return Array.isArray(v) ? v : [v];
  }

  function ensureStr(v, d = "") {
    if (v === null || v === undefined) return d;
    return typeof v === "string" ? v : String(v);
  }

  function ensureInt(v, d = 1) {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
    return d;
  }

  function normalizeQuestion(q) {
    const out = { ...(q || {}) };
    const qid = out.id ?? out.question_id ?? out.key;
    if (qid !== undefined && qid !== null) out.id = ensureStr(qid);

    if (!out.schema) {
      if (Array.isArray(out.options) && out.options.length) out.schema = "enum";
      else if (Array.isArray(out.values)) out.schema = "multi";
      else if ("text" in out) out.schema = "text";
      else out.schema = "consent_rating";
    }

    out.risk_level = ensureStr(out.risk_level || "A");
    out.tags = asList(out.tags).filter((t) => t !== null && t !== undefined).map((t) => String(t));
    out.label = "label" in out ? ensureStr(out.label) : ensureStr(out.id || "");
    out.help = ensureStr(out.help || "");
    return out;
  }

  function normalizeModule(m, idx) {
    const out = { ...(m || {}) };
    out.id = ensureStr(out.id || `module_${idx + 1}`);
    out.name = ensureStr(out.name || out.id);
    out.description = ensureStr(out.description || "");
    const questions = Array.isArray(out.questions) ? out.questions : [];
    out.questions = questions.filter((q) => q && typeof q === "object").map(normalizeQuestion);
    return out;
  }

  function validateTemplate(tpl) {
    if (!tpl || typeof tpl !== "object") return { ok: false, message: "template must be an object" };
    if (!Array.isArray(tpl.modules)) return { ok: false, message: "template.modules must be a list" };
    for (const mod of tpl.modules) {
      if (!mod || typeof mod !== "object") return { ok: false, message: "module must be an object" };
      if (!Array.isArray(mod.questions)) return { ok: false, message: "module.questions must be a list" };
      for (const q of mod.questions) {
        if (!q || typeof q !== "object") return { ok: false, message: "question must be an object" };
        if (!q.id) return { ok: false, message: "question.id is required" };
        if (!q.schema) return { ok: false, message: "question.schema is required" };
      }
    }
    return { ok: true, message: "ok" };
  }

  function normalizeTemplate(raw) {
    const tpl = raw && typeof raw === "object" ? JSON.parse(JSON.stringify(raw)) : {};
    tpl.id = ensureStr(tpl.id || "");
    tpl.name = ensureStr(tpl.name || "");
    tpl.version = ensureInt(tpl.version, 1);
    tpl.description = ensureStr(tpl.description || "");

    let modules = tpl.modules;
    if (!Array.isArray(modules)) {
      if (Array.isArray(tpl.questions)) {
        modules = [{ id: "default", name: "Fragen", questions: tpl.questions }];
      } else {
        modules = [];
      }
    }

    tpl.modules = modules.filter((m) => m && typeof m === "object").map(normalizeModule);

    const v = validateTemplate(tpl);
    if (!v.ok) throw new Error(`Invalid template: ${v.message}`);
    return tpl;
  }

  window.TemplateNormalization = { normalizeTemplate };
})();

