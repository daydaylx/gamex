// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'question.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$QuestionDependencyImpl _$$QuestionDependencyImplFromJson(
        Map<String, dynamic> json) =>
    _$QuestionDependencyImpl(
      id: json['id'] as String,
      values: (json['values'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
    );

Map<String, dynamic> _$$QuestionDependencyImplToJson(
        _$QuestionDependencyImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'values': instance.values,
    };

_$ConsentRatingQuestionImpl _$$ConsentRatingQuestionImplFromJson(
        Map<String, dynamic> json) =>
    _$ConsentRatingQuestionImpl(
      id: json['id'] as String,
      text: _readLabel(json, 'label') as String,
      help: json['help'] as String?,
      riskLevel: $enumDecodeNullable(
              _$RiskLevelEnumMap, _readRiskLevel(json, 'risk_level')) ??
          RiskLevel.low,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const <String>[],
      dependsOn: json['depends_on'] == null
          ? null
          : QuestionDependency.fromJson(
              json['depends_on'] as Map<String, dynamic>),
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$ConsentRatingQuestionImplToJson(
        _$ConsentRatingQuestionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'label': instance.text,
      'help': instance.help,
      'risk_level': _$RiskLevelEnumMap[instance.riskLevel]!,
      'tags': instance.tags,
      'depends_on': instance.dependsOn,
      'schema': instance.$type,
    };

const _$RiskLevelEnumMap = {
  RiskLevel.low: 'A',
  RiskLevel.medium: 'B',
  RiskLevel.high: 'C',
};

_$Scale1To10QuestionImpl _$$Scale1To10QuestionImplFromJson(
        Map<String, dynamic> json) =>
    _$Scale1To10QuestionImpl(
      id: json['id'] as String,
      text: _readLabel(json, 'label') as String,
      help: json['help'] as String?,
      riskLevel: $enumDecodeNullable(
              _$RiskLevelEnumMap, _readRiskLevel(json, 'risk_level')) ??
          RiskLevel.low,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const <String>[],
      dependsOn: json['depends_on'] == null
          ? null
          : QuestionDependency.fromJson(
              json['depends_on'] as Map<String, dynamic>),
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$Scale1To10QuestionImplToJson(
        _$Scale1To10QuestionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'label': instance.text,
      'help': instance.help,
      'risk_level': _$RiskLevelEnumMap[instance.riskLevel]!,
      'tags': instance.tags,
      'depends_on': instance.dependsOn,
      'schema': instance.$type,
    };

_$EnumQuestionImpl _$$EnumQuestionImplFromJson(Map<String, dynamic> json) =>
    _$EnumQuestionImpl(
      id: json['id'] as String,
      text: _readLabel(json, 'label') as String,
      help: json['help'] as String?,
      riskLevel: $enumDecodeNullable(
              _$RiskLevelEnumMap, _readRiskLevel(json, 'risk_level')) ??
          RiskLevel.low,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const <String>[],
      dependsOn: json['depends_on'] == null
          ? null
          : QuestionDependency.fromJson(
              json['depends_on'] as Map<String, dynamic>),
      options: (json['options'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$EnumQuestionImplToJson(_$EnumQuestionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'label': instance.text,
      'help': instance.help,
      'risk_level': _$RiskLevelEnumMap[instance.riskLevel]!,
      'tags': instance.tags,
      'depends_on': instance.dependsOn,
      'options': instance.options,
      'schema': instance.$type,
    };

_$MultiChoiceQuestionImpl _$$MultiChoiceQuestionImplFromJson(
        Map<String, dynamic> json) =>
    _$MultiChoiceQuestionImpl(
      id: json['id'] as String,
      text: _readLabel(json, 'label') as String,
      help: json['help'] as String?,
      riskLevel: $enumDecodeNullable(
              _$RiskLevelEnumMap, _readRiskLevel(json, 'risk_level')) ??
          RiskLevel.low,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const <String>[],
      dependsOn: json['depends_on'] == null
          ? null
          : QuestionDependency.fromJson(
              json['depends_on'] as Map<String, dynamic>),
      options: (json['options'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$MultiChoiceQuestionImplToJson(
        _$MultiChoiceQuestionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'label': instance.text,
      'help': instance.help,
      'risk_level': _$RiskLevelEnumMap[instance.riskLevel]!,
      'tags': instance.tags,
      'depends_on': instance.dependsOn,
      'options': instance.options,
      'schema': instance.$type,
    };

_$TextQuestionImpl _$$TextQuestionImplFromJson(Map<String, dynamic> json) =>
    _$TextQuestionImpl(
      id: json['id'] as String,
      text: _readLabel(json, 'label') as String,
      help: json['help'] as String?,
      riskLevel: $enumDecodeNullable(
              _$RiskLevelEnumMap, _readRiskLevel(json, 'risk_level')) ??
          RiskLevel.low,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList() ??
              const <String>[],
      dependsOn: json['depends_on'] == null
          ? null
          : QuestionDependency.fromJson(
              json['depends_on'] as Map<String, dynamic>),
      placeholder: json['placeholder'] as String?,
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$TextQuestionImplToJson(_$TextQuestionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'label': instance.text,
      'help': instance.help,
      'risk_level': _$RiskLevelEnumMap[instance.riskLevel]!,
      'tags': instance.tags,
      'depends_on': instance.dependsOn,
      'placeholder': instance.placeholder,
      'schema': instance.$type,
    };
