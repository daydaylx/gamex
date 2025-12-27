// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'template_manifest.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TemplateManifestImpl _$$TemplateManifestImplFromJson(
        Map<String, dynamic> json) =>
    _$TemplateManifestImpl(
      templates: (json['templates'] as List<dynamic>?)
              ?.map((e) =>
                  TemplateManifestItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const <TemplateManifestItem>[],
    );

Map<String, dynamic> _$$TemplateManifestImplToJson(
        _$TemplateManifestImpl instance) =>
    <String, dynamic>{
      'templates': instance.templates,
    };

_$TemplateManifestItemImpl _$$TemplateManifestItemImplFromJson(
        Map<String, dynamic> json) =>
    _$TemplateManifestItemImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      version: (json['version'] as num?)?.toInt(),
      description: json['description'] as String?,
      assetPath: json['asset'] as String,
    );

Map<String, dynamic> _$$TemplateManifestItemImplToJson(
        _$TemplateManifestItemImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'version': instance.version,
      'description': instance.description,
      'asset': instance.assetPath,
    };
