(() => {
  "use strict";

  function _statusPair(a, b) {
    if (a === "NO" || a === "HARD_LIMIT" || b === "NO" || b === "HARD_LIMIT") return "BOUNDARY";
    if (a === "YES" && b === "YES") return "MATCH";
    return "EXPLORE";
  }

  function _safeInt(v) {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : Math.trunc(n);
  }

  function _absDelta(a, b) {
    if (a === null || b === null) return null;
    return Math.abs(a - b);
  }

  function _flagLowComfortHighInterest(entry) {
    try {
      const i = Number(entry.interest);
      const c = Number(entry.comfort);
      return i >= 3 && c <= 2;
    } catch (_e) {
      return false;
    }
  }

  function _generateActionPlan(items) {
    const matches = items.filter((it) => it.pair_status === "MATCH" && it.schema === "consent_rating");

    const comfortFiltered = [];
    for (const m of matches) {
      const ca = _safeInt(m.a?.comfort) || 0;
      const cb = _safeInt(m.b?.comfort) || 0;
      if (ca >= 3 && cb >= 3) comfortFiltered.push(m);
    }

    const scored = comfortFiltered.map((m) => {
      const ia = _safeInt(m.a?.interest) || 0;
      const ib = _safeInt(m.b?.interest) || 0;
      const ca = _safeInt(m.a?.comfort) || 0;
      const cb = _safeInt(m.b?.comfort) || 0;
      let score = ia + ib + ca + cb;
      if (m.risk_level === "B") score += 1;
      if (m.risk_level === "A") score += 2;
      return { score, item: m };
    });

    scored.sort((a, b) => b.score - a.score);

    const plan = [];
    const usedModules = new Set();
    const usedTags = new Set();
    const tagCategories = {
      soft: ["kissing", "touching", "cuddling"],
      toy: ["toy", "vibrator", "plug"],
      kink: ["bdsm", "roleplay", "fetish"],
      intense: ["impact", "breath", "edge"],
    };

    for (const entry of scored) {
      if (plan.length >= 3) break;
      const tags = new Set(entry.item.tags || []);
      let category = null;
      for (const [cat, tagList] of Object.entries(tagCategories)) {
        if (tagList.some((t) => tags.has(t))) {
          category = cat;
          break;
        }
      }
      if (category && !usedTags.has(category)) {
        plan.push(entry.item);
        usedModules.add(entry.item.module_id);
        usedTags.add(category);
      }
    }

    for (const entry of scored) {
      if (plan.length >= 3) break;
      if (!usedModules.has(entry.item.module_id) && !plan.includes(entry.item)) {
        plan.push(entry.item);
        usedModules.add(entry.item.module_id);
      }
    }

    for (const entry of scored) {
      if (plan.length >= 3) break;
      if (!plan.includes(entry.item)) {
        plan.push(entry.item);
      }
    }

    return plan;
  }

  function compare(template, respA, respB, scenarios = []) {
    const items = [];
    const summary = {
      counts: { MATCH: 0, EXPLORE: 0, BOUNDARY: 0 },
      flags: { low_comfort_high_interest: 0, big_delta: 0, high_risk: 0, hard_limit_violation: 0 },
      generated_at: new Date().toISOString(),
    };

    const modules = template.modules || [];
    for (const mod of modules) {
      const modId = mod.id || "";
      const modName = mod.name || "";
      for (const q of mod.questions || []) {
        const qid = q.id;
        const schema = q.schema;
        const risk = q.risk_level || "A";
        const label = q.label || "";
        const helpText = q.help || "";
        const tags = q.tags || [];

        const row = {
          question_id: qid,
          module_id: modId,
          module_name: modName,
          label,
          help: helpText,
          schema,
          risk_level: risk,
          tags,
        };

        const a = respA[qid] && typeof respA[qid] === "object" ? respA[qid] : {};
        const b = respB[qid] && typeof respB[qid] === "object" ? respB[qid] : {};
        row.a = a;
        row.b = b;

        const flags = [];
        let pairStatus = null;

        if (schema === "consent_rating") {
          if (a.dom_status !== undefined || b.dom_status !== undefined) {
            const domStatus = _statusPair(a.dom_status || "MAYBE", b.dom_status || "MAYBE");
            const subStatus = _statusPair(a.sub_status || "MAYBE", b.sub_status || "MAYBE");

            if (domStatus === "BOUNDARY" || subStatus === "BOUNDARY") pairStatus = "BOUNDARY";
            else if (domStatus === "MATCH" && subStatus === "MATCH") pairStatus = "MATCH";
            else pairStatus = "EXPLORE";

            const domIa = _safeInt(a.dom_interest);
            const domIb = _safeInt(b.dom_interest);
            const domCa = _safeInt(a.dom_comfort);
            const domCb = _safeInt(b.dom_comfort);
            const subIa = _safeInt(a.sub_interest);
            const subIb = _safeInt(b.sub_interest);
            const subCa = _safeInt(a.sub_comfort);
            const subCb = _safeInt(b.sub_comfort);

            row.delta_interest = Math.max(_absDelta(domIa, domIb) || 0, _absDelta(subIa, subIb) || 0);
            row.delta_comfort = Math.max(_absDelta(domCa, domCb) || 0, _absDelta(subCa, subCb) || 0);

            row.dom_status = domStatus;
            row.sub_status = subStatus;
          } else if (a.active_status !== undefined || b.active_status !== undefined) {
            const activeStatus = _statusPair(a.active_status || "MAYBE", b.active_status || "MAYBE");
            const passiveStatus = _statusPair(a.passive_status || "MAYBE", b.passive_status || "MAYBE");

            if (activeStatus === "BOUNDARY" || passiveStatus === "BOUNDARY") pairStatus = "BOUNDARY";
            else if (activeStatus === "MATCH" && passiveStatus === "MATCH") pairStatus = "MATCH";
            else pairStatus = "EXPLORE";

            const activeIa = _safeInt(a.active_interest);
            const activeIb = _safeInt(b.active_interest);
            const activeCa = _safeInt(a.active_comfort);
            const activeCb = _safeInt(b.active_comfort);
            const passiveIa = _safeInt(a.passive_interest);
            const passiveIb = _safeInt(b.passive_interest);
            const passiveCa = _safeInt(a.passive_comfort);
            const passiveCb = _safeInt(b.passive_comfort);

            row.delta_interest = Math.max(_absDelta(activeIa, activeIb) || 0, _absDelta(passiveIa, passiveIb) || 0);
            row.delta_comfort = Math.max(_absDelta(activeCa, activeCb) || 0, _absDelta(passiveCa, passiveCb) || 0);

            row.active_status = activeStatus;
            row.passive_status = passiveStatus;
          } else {
            const sa = a.status;
            const sb = b.status;
            pairStatus = sa && sb ? _statusPair(sa, sb) : "EXPLORE";

            const wantsIt = ["YES", "MAYBE"];
            if ((sa === "HARD_LIMIT" && wantsIt.includes(sb)) || (sb === "HARD_LIMIT" && wantsIt.includes(sa))) {
              flags.push("hard_limit_violation");
              summary.flags.hard_limit_violation += 1;
            }

            const ia = _safeInt(a.interest);
            const ib = _safeInt(b.interest);
            const ca = _safeInt(a.comfort);
            const cb = _safeInt(b.comfort);

            row.delta_interest = _absDelta(ia, ib);
            row.delta_comfort = _absDelta(ca, cb);

            if (_flagLowComfortHighInterest(a) || _flagLowComfortHighInterest(b)) {
              flags.push("low_comfort_high_interest");
              summary.flags.low_comfort_high_interest += 1;
            }

            if ((row.delta_interest !== null && row.delta_interest >= 3) || (row.delta_comfort !== null && row.delta_comfort >= 3)) {
              flags.push("big_delta");
              summary.flags.big_delta += 1;
            }
          }
        } else if (schema === "scale_0_10") {
          const va = _safeInt(a.value);
          const vb = _safeInt(b.value);
          row.delta_value = _absDelta(va, vb);
          pairStatus = va !== null && vb !== null && row.delta_value <= 1 ? "MATCH" : "EXPLORE";
          if (row.delta_value !== null && row.delta_value >= 4) {
            flags.push("big_delta");
            summary.flags.big_delta += 1;
          }
        } else if (schema === "enum") {
          const va = a.value;
          const vb = b.value;
          row.match_value = va === vb && va !== undefined && va !== null;
          pairStatus = row.match_value ? "MATCH" : "EXPLORE";
        } else if (schema === "multi") {
          const la = Array.isArray(a.values) ? a.values : [];
          const lb = Array.isArray(b.values) ? b.values : [];
          const inter = Array.from(new Set(la.filter((v) => lb.includes(v)))).sort();
          row.intersection = inter;
          pairStatus = inter.length ? "MATCH" : "EXPLORE";
        } else if (schema === "text") {
          pairStatus = "EXPLORE";
        } else {
          pairStatus = "EXPLORE";
        }

        if (risk === "C") {
          flags.push("high_risk");
          summary.flags.high_risk += 1;
        }

        row.pair_status = pairStatus;
        row.flags = flags;

        if (summary.counts[pairStatus] !== undefined) {
          summary.counts[pairStatus] += 1;
        }

        items.push(row);
      }
    }

    for (const scen of scenarios || []) {
      const sid = scen.id;
      const key = `SCENARIO_${sid}`;
      const sa = respA[key];
      const sb = respB[key];

      if (sa || sb) {
        const choiceA = sa && typeof sa === "object" ? sa.choice : null;
        const choiceB = sb && typeof sb === "object" ? sb.choice : null;

        let pStatus = "EXPLORE";
        if (choiceA && choiceB) {
          if (choiceA === choiceB) {
            pStatus = "MATCH";
          } else {
            const riskA = sa?.risk_type;
            const riskB = sb?.risk_type;
            const riskyTypes = ["active", "explore", "masochism", "submission", "fantasy_active"];
            const stopTypes = ["boundary", "safety", "no"];
            if ((riskyTypes.includes(riskA) && stopTypes.includes(riskB)) || (riskyTypes.includes(riskB) && stopTypes.includes(riskA))) {
              pStatus = "BOUNDARY";
            }
          }
        }

        if (summary.counts[pStatus] !== undefined) summary.counts[pStatus] += 1;

        items.push({
          question_id: sid,
          module_id: "scenarios",
          module_name: `Szenario: ${scen.category}`,
          label: scen.title,
          help: scen.description,
          schema: "scenario",
          risk_level: "B",
          tags: ["scenario"],
          a: sa,
          b: sb,
          pair_status: pStatus,
          flags: ["scenario"],
        });
      }
    }

    const order = { BOUNDARY: 0, EXPLORE: 1, MATCH: 2 };
    items.sort((x, y) => {
      const ax = order[x.pair_status] ?? 9;
      const ay = order[y.pair_status] ?? 9;
      if (ax !== ay) return ax - ay;
      const rx = x.risk_level === "C" ? 0 : 1;
      const ry = y.risk_level === "C" ? 0 : 1;
      if (rx !== ry) return rx - ry;
      const mx = x.module_name || "";
      const my = y.module_name || "";
      if (mx !== my) return mx.localeCompare(my);
      return String(x.question_id || "").localeCompare(String(y.question_id || ""));
    });

    const actionPlan = _generateActionPlan(items);
    const meta = {
      template_id: template.id,
      template_name: template.name,
      template_version: template.version,
    };
    return { meta, summary, items, action_plan: actionPlan };
  }

  window.CoreCompare = {
    compare,
    _statusPair,
  };
})();

