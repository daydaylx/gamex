_Ök54^#!/usr/bin/env python3
"""
Converter script to convert fragebogen-umfassend.md to JSON template format.
"""

import re
import json
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict

# Module mapping based on the markdown structure
MODULE_MAPPING = {
    "1. Persönliches / Kommunikation / Rahmen": {
        "id": "frame",
        "name": "Rahmen, Kommunikation & Gesundheit",
        "description": "Persönliche Werte, Kommunikation, Beziehungsformen, digitale Privatsphäre."
    },
    "2. Gesundheit & Sicherheit": {
        "id": "health",
        "name": "Gesundheit & Sicherheit",
        "description": "Medizinische Einschränkungen, Safeword, Aftercare, Konsens."
    },
    "3. Rollen & Identität": {
        "id": "roles",
        "name": "Rollen & Identität",
        "description": "BDSM-Rollen, Erfahrung, Häufigkeit, Identität."
    },
    "4. Körper & Nähe": {
        "id": "body",
        "name": "Körper & Nähe",
        "description": "Küssen, Kuscheln, Berührungen, Nacktheit."
    },
    "5. Sexuelle Praktiken - Basis": {
        "id": "sex_basic",
        "name": "Sexuelle Praktiken - Basis",
        "description": "Vulva, Penis, Hoden, manuelle Stimulation."
    },
    "6. Sexuelle Praktiken - Anal": {
        "id": "sex_anal",
        "name": "Anal (Granular)",
        "description": "Hygiene & Vorbereitung sind Pflicht. Nur mit viel Gleitgel."
    },
    "7. Oralsex & Mund": {
        "id": "oral",
        "name": "Oralsex & Mund",
        "description": "Oralverkehr, Ejakulat, Körperflüssigkeiten."
    },
    "8. BDSM: Macht & Kontrolle": {
        "id": "bdsm_power",
        "name": "BDSM: Macht & Kontrolle",
        "description": "Befehle, Gehorsam, Erniedrigung, Orgasmuskontrolle."
    },
    "9. BDSM: Impact & Schmerz": {
        "id": "bdsm_impact",
        "name": "BDSM: Impact & Schmerz",
        "description": "Spanking, Impact Tools, Körperzonen, Schmerzlust."
    },
    "10. BDSM: Bondage & Fesselung": {
        "id": "bdsm_bondage",
        "name": "BDSM: Bondage",
        "description": "Soft Bondage, feste Bondage, Sinnesentzug, Gag."
    },
    "11. BDSM: Sensation Play": {
        "id": "bdsm_sensation",
        "name": "BDSM: Sensation Play",
        "description": "Temperatur, Elektro, Nadelspiele."
    },
    "12. Fetische & Materialien": {
        "id": "fetish",
        "name": "Fetische & Materialien",
        "description": "Materialien, Rollenspiele, Sexspielzeug, Safer Sex."
    },
    "13. Atemkontrolle & High-Risk Praktiken": {
        "id": "breathplay",
        "name": "Atemkontrolle & High-Risk",
        "description": "⚠️ EXTREM RISIKOREICH - kann zu schweren Verletzungen oder Tod führen!"
    },
    "14. Öffentlichkeit & Gruppen": {
        "id": "public",
        "name": "Öffentlichkeit & Gruppen",
        "description": "Exhibitionismus, Voyeurismus, Gruppensex, Dreier."
    },
    "15. Extreme Praktiken & Tabus": {
        "id": "extreme",
        "name": "Extreme Praktiken",
        "description": "⚠️ WARNUNG: Extrem risikoreich, erfordert Profi-Wissen."
    },
    "16. Emotionen & Beziehung": {
        "id": "emotions",
        "name": "Emotionen & Beziehung",
        "description": "Beziehungsformen, emotionale Bedürfnisse, Intensität."
    },
    "17. Review & Ausblick": {
        "id": "review",
        "name": "Review & Ausblick",
        "description": "Wiederholungswünsche, Highlights, Notizen."
    },
}

# Risk level mapping based on content
RISK_LEVEL_MAPPING = {
    "breathplay": "C",
    "extreme": "C",
    "bdsm_sensation": "B",  # Nadelspiele are C, but module is B
    "sex_anal": "B",
    "bdsm_impact": "B",
    "bdsm_bondage": "B",
    "public": "B",
}

# Tags mapping
TAG_MAPPING = {
    "frame": ["communication", "safety", "privacy"],
    "health": ["safety", "medical"],
    "roles": ["bdsm", "identity"],
    "body": ["intimacy", "touch"],
    "sex_basic": ["sex", "genital"],
    "sex_anal": ["anal", "sex"],
    "oral": ["oral", "sex"],
    "bdsm_power": ["bdsm", "power", "control"],
    "bdsm_impact": ["bdsm", "impact", "pain"],
    "bdsm_bondage": ["bdsm", "bondage"],
    "bdsm_sensation": ["bdsm", "sensation"],
    "fetish": ["fetish", "materials"],
    "breathplay": ["bdsm", "high-risk", "breathplay"],
    "public": ["public", "group"],
    "extreme": ["extreme", "high-risk"],
    "emotions": ["emotions", "relationship"],
    "review": ["review"],
}

def parse_markdown_table(line: str) -> Optional[List[str]]:
    """Parse a markdown table row, return list of cells or None if not a table row."""
    if not line.strip().startswith("|"):
        return None
    # Remove leading/trailing | and split
    cells = [c.strip() for c in line.strip().split("|")[1:-1]]
    return cells

def determine_schema(module_id: str, label: str, has_dom_sub: bool, has_yes_no_maybe: bool, 
                     has_scale: bool, is_bdsm_7point: bool) -> str:
    """Determine the schema type based on question characteristics."""
    if has_scale and "0-10" in label or "Skala 0-10" in label:
        return "scale_0_10"
    if has_yes_no_maybe:
        return "consent_rating"
    if is_bdsm_7point or has_dom_sub:
        # For BDSM 7-point scale, we'll map to consent_rating with mapping rules
        return "consent_rating"
    if "Auswahl" in label or "Auswahl" in label:
        return "enum"
    # Default for most questions
    return "consent_rating"

def map_7point_to_consent_rating(rating: int) -> Dict[str, Any]:
    """Map 7-point BDSM scale (1-7) to consent_rating format.
    1-2: YES (interest 4, comfort 4)
    3: YES (interest 3, comfort 3)
    4: MAYBE (interest 2, comfort 2)
    5-7: NO (interest 0-1, comfort 0-1)
    """
    if rating <= 2:
        return {"status": "YES", "interest": 4, "comfort": 4}
    elif rating == 3:
        return {"status": "YES", "interest": 3, "comfort": 3}
    elif rating == 4:
        return {"status": "MAYBE", "interest": 2, "comfort": 2}
    elif rating == 5:
        return {"status": "NO", "interest": 1, "comfort": 1}
    else:  # 6-7
        return {"status": "NO", "interest": 0, "comfort": 0}

def determine_risk_level(module_id: str, label: str, help_text: str) -> str:
    """Determine risk level based on module and content."""
    # Check module-level risk
    if module_id in RISK_LEVEL_MAPPING:
        base_risk = RISK_LEVEL_MAPPING[module_id]
        # Some specific items in B modules are C
        if base_risk == "B":
            if any(word in label.lower() for word in ["nadel", "cutting", "branding", "blut"]):
                return "C"
            if any(word in label.lower() for word in ["atem", "breath", "choking", "würgen", "strangulation"]):
                return "C"
        return base_risk
    return "A"

def extract_safety_warnings(lines: List[str], start_idx: int, max_lines: int = 10) -> Tuple[str, int]:
    """Extract safety warnings from text blocks. Returns (warning_text, end_index). Optimized version."""
    if start_idx >= len(lines):
        return "", start_idx
    
    # Quick check if we're in a warning block
    warning_keywords = ["WICHTIG", "WARNUNG", "⚠️", "**WICHTIG**", "**Hinweis**", "Hinweis:"]
    first_line = lines[start_idx] if start_idx < len(lines) else ""
    
    if not any(kw in first_line for kw in warning_keywords):
        return "", start_idx
    
    warning_lines = []
    i = start_idx
    end_idx = min(start_idx + max_lines, len(lines))
    
    # Collect warning lines
    while i < end_idx:
        line = lines[i]
        if line.strip().startswith("###") or line.strip().startswith("##"):
            break
        if line.strip().startswith("|") and warning_lines:
            # Table starts, stop collecting
            break
        if line.strip() or warning_lines:  # Include empty lines if we already have content
            warning_lines.append(line)
        i += 1
    
    if warning_lines:
        return "\n".join(warning_lines), i
    return "", start_idx

def parse_markdown_file(filepath: str) -> Dict[str, Any]:
    """Parse the comprehensive questionnaire markdown file."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    lines = content.split("\n")
    modules: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    current_module = None
    current_section = None
    current_help = ""
    question_counter = defaultdict(int)
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check for module header (## X. Name)
        module_match = re.match(r"^## (\d+)\. (.+)$", line)
        if module_match:
            module_num = module_match.group(1)
            module_name = module_match.group(2)
            # Find matching module
            for key, module_info in MODULE_MAPPING.items():
                if key.startswith(f"{module_num}."):
                    current_module = module_info["id"]
                    # Check for warnings in following lines
                    warning_text, end_idx = extract_safety_warnings(lines, i + 1)
                    current_help = warning_text
                    if end_idx > i:
                        i = end_idx
                    else:
                        i += 1
                    break
            continue
        
        # Check for subsection (### Name)
        subsection_match = re.match(r"^### (.+)$", line)
        if subsection_match:
            current_section = subsection_match.group(1)
            # Check for warnings after subsection header
            warning_text, end_idx = extract_safety_warnings(lines, i + 1)
            if warning_text:
                current_help = warning_text
                i = end_idx
            else:
                i += 1
            continue
        
        # Check for table header
        if line.strip().startswith("|") and "---" in lines[i+1] if i+1 < len(lines) else False:
            # This is a table
            header = parse_markdown_table(line)
            if not header:
                i += 1
                continue
            
            # Determine table type
            has_dom_sub = "Dom" in " ".join(header) and "Sub" in " ".join(header)
            has_yes_no_maybe = "Ja" in " ".join(header) and "Nein" in " ".join(header) and "Vielleicht" in " ".join(header)
            has_scale = "Skala" in " ".join(header) or "0-10" in " ".join(header)
            has_auswahl = "Auswahl" in " ".join(header)
            
            # Skip separator line
            i += 1
            if i >= len(lines):
                break
            
            # Parse table rows
            while i < len(lines):
                row_line = lines[i]
                if not row_line.strip().startswith("|"):
                    break
                
                cells = parse_markdown_table(row_line)
                if not cells or len(cells) < 2:
                    i += 1
                    continue
                
                # First cell is usually the topic/label
                topic = cells[0].strip()
                if not topic or topic == "Thema" or "---" in topic:
                    i += 1
                    continue
                
                # Determine schema
                if has_scale:
                    schema = "scale_0_10"
                elif has_auswahl:
                    schema = "enum"
                    # Extract options from header or cells
                    options = []
                    for cell in cells[1:]:
                        if cell.strip() and cell.strip() not in ["Dom", "Sub", "Ja", "Nein", "Vielleicht", "Bemerkungen/Bedingungen"]:
                            options.append(cell.strip())
                    if not options:
                        # Try to infer from context
                        schema = "consent_rating"
                elif has_yes_no_maybe:
                    schema = "consent_rating"
                elif has_dom_sub:
                    # BDSM 7-point scale, map to consent_rating
                    schema = "consent_rating"
                else:
                    schema = "consent_rating"
                
                # Generate question ID
                question_counter[current_module] += 1
                qid = f"{current_module.upper()[:3]}{question_counter[current_module]:03d}"
                
                # Determine risk level
                risk_level = determine_risk_level(current_module, topic, current_help)
                
                # Get tags
                tags = TAG_MAPPING.get(current_module, [])
                # Add specific tags based on content
                if any(word in topic.lower() for word in ["anal", "anus", "po"]):
                    tags.append("anal")
                if any(word in topic.lower() for word in ["vaginal", "vulva", "klitoris"]):
                    tags.append("vaginal")
                if any(word in topic.lower() for word in ["penis", "hoden"]):
                    tags.append("penis")
                if any(word in topic.lower() for word in ["oral", "mund", "lecken", "saugen"]):
                    tags.append("oral")
                if any(word in topic.lower() for word in ["aktiv", "geben"]):
                    tags.append("active")
                if any(word in topic.lower() for word in ["passiv", "empfangen"]):
                    tags.append("passive")
                
                # Build question object
                question: Dict[str, Any] = {
                    "id": qid,
                    "schema": schema,
                    "risk_level": risk_level,
                    "tags": list(set(tags)),  # Remove duplicates
                    "label": topic,
                }
                
                # Add help text if available
                help_parts = []
                if current_help:
                    help_parts.append(current_help)
                if current_section and current_section not in str(current_help):
                    help_parts.append(f"Kategorie: {current_section}")
                
                # Add specific warnings based on content
                if any(word in topic.lower() for word in ["fisting", "faust"]):
                    help_parts.append("WARNUNG: Erfordert Profi-Wissen, viel Zeit und Hygiene. Verletzungsgefahr.")
                if any(word in topic.lower() for word in ["atem", "breath", "choking", "würgen"]):
                    help_parts.append("⚠️ EXTREM RISIKOREICH: Kann zu schweren Verletzungen oder Tod führen!")
                if any(word in topic.lower() for word in ["anal", "anus", "po"]) and "penetration" in topic.lower():
                    help_parts.append("WICHTIG: Hygiene & Vorbereitung sind Pflicht. Nur mit viel Gleitgel.")
                if any(word in topic.lower() for word in ["nadel", "cutting", "branding", "blut"]):
                    help_parts.append("WARNUNG: HIGH RISK! Strenge Hygiene erforderlich. Nur sterile Instrumente.")
                
                if help_parts:
                    question["help"] = "\n\n".join(help_parts)
                
                # Add options for enum
                if schema == "enum" and "options" in locals() and options:
                    question["options"] = options
                
                # Handle active/passive variants
                if "aktiv" in topic.lower() or "passiv" in topic.lower():
                    # Mark for special handling in frontend
                    question["has_active_passive"] = True
                
                # Handle Dom/Sub variants
                if has_dom_sub:
                    question["has_dom_sub"] = True
                
                modules[current_module].append(question)
                i += 1
            
            continue
        
        # Check for standalone text questions (like scale 0-10)
        scale_match = re.search(r"Skala 0-10|0-10|0 = .+ 10 =", line)
        if scale_match and current_module:
            # Try to extract question
            if "|" in line:
                cells = parse_markdown_table(line)
                if cells and len(cells) >= 2:
                    topic = cells[0].strip()
                    if topic and topic != "Thema":
                        question_counter[current_module] += 1
                        qid = f"{current_module.upper()[:3]}{question_counter[current_module]:03d}"
                        
                        question = {
                            "id": qid,
                            "schema": "scale_0_10",
                            "risk_level": determine_risk_level(current_module, topic, current_help),
                            "tags": TAG_MAPPING.get(current_module, []),
                            "label": topic,
                        }
                        
                        if current_help:
                            question["help"] = current_help
                        
                        modules[current_module].append(question)
        
        i += 1
    
    # Build final template structure
    template_modules = []
    for module_key, module_info in MODULE_MAPPING.items():
        module_id = module_info["id"]
        if module_id in modules:
            template_modules.append({
                "id": module_id,
                "name": module_info["name"],
                "description": module_info["description"],
                "questions": modules[module_id]
            })
    
    return {
        "id": "comprehensive_v1",
        "name": "Umfassender Intimität & BDSM Fragebogen",
        "version": 1,
        "description": "Kombiniert aus GentleDom, QueerTopia und Gamex Fragebogen. ~200+ Fragen zu Sexualität, BDSM, Grenzen und Kommunikation.",
        "modules": template_modules
    }

def main():
    """Main conversion function."""
    input_file = "fragebogen-umfassend.md"
    output_file = "app/templates/comprehensive_v1.json"
    
    print(f"Converting {input_file} to {output_file}...")
    template = parse_markdown_file(input_file)
    
    # Write output
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(template, f, ensure_ascii=False, indent=2)
    
    # Print statistics
    total_questions = sum(len(m["questions"]) for m in template["modules"])
    print(f"✓ Conversion complete!")
    print(f"  Modules: {len(template['modules'])}")
    print(f"  Questions: {total_questions}")
    print(f"  Output: {output_file}")

if __name__ == "__main__":
    main()

