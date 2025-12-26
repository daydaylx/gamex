"""
Template Loader Service

Loads and manages templates for mobile app.
Reuses backend logic where possible.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List


class TemplateLoader:
    """
    Template loader service for mobile app.

    Loads templates from embedded assets or backend directory.
    """

    def __init__(self):
        """Initialize template loader."""
        self.templates_dir = self._get_templates_dir()
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _get_templates_dir(self) -> Path:
        """
        Get templates directory path.

        Returns:
            Path to templates directory
        """
        # Try mobile assets first
        mobile_dir = Path(__file__).parent.parent
        assets_templates = mobile_dir / 'assets' / 'templates'

        if assets_templates.exists():
            return assets_templates

        # Fallback to backend templates
        # Backend templates live in backend/app/templates in this repo.
        backend_dir = mobile_dir.parent / 'backend' / 'app' / 'templates'
        if backend_dir.exists():
            return backend_dir

        # Create assets directory if neither exists
        assets_templates.mkdir(parents=True, exist_ok=True)
        return assets_templates

    def list_templates(self) -> List[Dict[str, str]]:
        """
        List all available templates.

        Returns:
            List of template metadata dicts with id, name, version
        """
        templates = []

        if not self.templates_dir.exists():
            return templates

        # Scan for JSON files
        for template_file in self.templates_dir.glob('*.json'):
            try:
                with open(template_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                templates.append({
                    'id': template_file.stem,
                    'name': data.get('name', template_file.stem),
                    'version': data.get('version', 1),
                })
            except Exception as e:
                print(f"Error loading template {template_file}: {e}")
                continue

        return templates

    def load_template(self, template_id: str) -> Dict[str, Any]:
        """
        Load a specific template by ID.

        Args:
            template_id: Template identifier

        Returns:
            Template dictionary

        Raises:
            FileNotFoundError: If template not found
        """
        # Check cache first
        if template_id in self._cache:
            return self._cache[template_id]

        # Load from file
        template_file = self.templates_dir / f'{template_id}.json'

        if not template_file.exists():
            raise FileNotFoundError(f"Template not found: {template_id}")

        with open(template_file, 'r', encoding='utf-8') as f:
            template = json.load(f)

        # Normalize template (basic normalization)
        template = self._normalize_template(template)

        # Cache it
        self._cache[template_id] = template

        return template

    def _normalize_template(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize template structure.

        Args:
            template: Raw template dictionary

        Returns:
            Normalized template
        """
        # Basic normalization - ensure required fields
        if 'id' not in template:
            template['id'] = 'unknown'

        if 'name' not in template:
            template['name'] = 'Unnamed Template'

        if 'version' not in template:
            template['version'] = 1

        if 'modules' not in template:
            template['modules'] = []

        # Normalize modules
        for module in template['modules']:
            if 'questions' not in module:
                module['questions'] = []

        return template

    def get_template_info(self, template_id: str) -> Dict[str, str]:
        """
        Get template metadata without loading full template.

        Args:
            template_id: Template identifier

        Returns:
            Template metadata dict
        """
        template_file = self.templates_dir / f'{template_id}.json'

        if not template_file.exists():
            raise FileNotFoundError(f"Template not found: {template_id}")

        with open(template_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return {
            'id': template_id,
            'name': data.get('name', template_id),
            'version': str(data.get('version', 1)),
        }
