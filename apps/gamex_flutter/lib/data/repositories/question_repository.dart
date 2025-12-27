import 'dart:convert';

import 'package:flutter/services.dart';

import '../../domain/entities/template.dart';
import '../../domain/entities/template_manifest.dart';

class QuestionRepository {
  QuestionRepository({
    AssetBundle? bundle,
    this.manifestAssetPath = 'assets/templates/templates.json',
  }) : _bundle = bundle ?? rootBundle;

  final AssetBundle _bundle;
  final String manifestAssetPath;

  Future<TemplateManifest> loadManifest() async {
    final raw = await _bundle.loadString(manifestAssetPath);
    final json = jsonDecode(raw) as Map<String, dynamic>;
    return TemplateManifest.fromJson(json);
  }

  Future<List<TemplateManifestItem>> listTemplates() async {
    final manifest = await loadManifest();
    return manifest.templates;
  }

  Future<Template> loadTemplate(String templateId) async {
    final manifest = await loadManifest();
    final item = manifest.templates.firstWhere(
      (entry) => entry.id == templateId,
      orElse: () => throw ArgumentError('Unknown template: $templateId'),
    );
    return _loadTemplateAsset(item.assetPath);
  }

  Future<Template> loadTemplateByAsset(String assetPath) async {
    return _loadTemplateAsset(assetPath);
  }

  Future<Template> _loadTemplateAsset(String assetPath) async {
    final raw = await _bundle.loadString(assetPath);
    final json = jsonDecode(raw) as Map<String, dynamic>;
    return Template.fromJson(json);
  }
}
