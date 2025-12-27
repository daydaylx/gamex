import 'package:freezed_annotation/freezed_annotation.dart';

part 'template_manifest.freezed.dart';
part 'template_manifest.g.dart';

@freezed
class TemplateManifest with _$TemplateManifest {
  const factory TemplateManifest({
    @Default(<TemplateManifestItem>[]) List<TemplateManifestItem> templates,
  }) = _TemplateManifest;

  factory TemplateManifest.fromJson(Map<String, dynamic> json) =>
      _$TemplateManifestFromJson(json);
}

@freezed
class TemplateManifestItem with _$TemplateManifestItem {
  const factory TemplateManifestItem({
    required String id,
    required String name,
    int? version,
    String? description,
    @JsonKey(name: 'asset') required String assetPath,
  }) = _TemplateManifestItem;

  factory TemplateManifestItem.fromJson(Map<String, dynamic> json) =>
      _$TemplateManifestItemFromJson(json);
}
