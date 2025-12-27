// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'answer.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ConsentRatingAnswerImpl _$$ConsentRatingAnswerImplFromJson(
        Map<String, dynamic> json) =>
    _$ConsentRatingAnswerImpl(
      status: $enumDecode(_$ConsentStatusEnumMap, json['status']),
      intensity: (json['intensity'] as num?)?.toInt() ?? 0,
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$ConsentRatingAnswerImplToJson(
        _$ConsentRatingAnswerImpl instance) =>
    <String, dynamic>{
      'status': _$ConsentStatusEnumMap[instance.status]!,
      'intensity': instance.intensity,
      'schema': instance.$type,
    };

const _$ConsentStatusEnumMap = {
  ConsentStatus.yes: 'YES',
  ConsentStatus.maybe: 'MAYBE',
  ConsentStatus.no: 'NO',
  ConsentStatus.hardLimit: 'HARD_LIMIT',
};

_$Scale1To10AnswerImpl _$$Scale1To10AnswerImplFromJson(
        Map<String, dynamic> json) =>
    _$Scale1To10AnswerImpl(
      value: (json['value'] as num).toInt(),
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$Scale1To10AnswerImplToJson(
        _$Scale1To10AnswerImpl instance) =>
    <String, dynamic>{
      'value': instance.value,
      'schema': instance.$type,
    };

_$EnumAnswerImpl _$$EnumAnswerImplFromJson(Map<String, dynamic> json) =>
    _$EnumAnswerImpl(
      option: json['option'] as String,
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$EnumAnswerImplToJson(_$EnumAnswerImpl instance) =>
    <String, dynamic>{
      'option': instance.option,
      'schema': instance.$type,
    };

_$MultiChoiceAnswerImpl _$$MultiChoiceAnswerImplFromJson(
        Map<String, dynamic> json) =>
    _$MultiChoiceAnswerImpl(
      values: (json['values'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const <String>[],
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$MultiChoiceAnswerImplToJson(
        _$MultiChoiceAnswerImpl instance) =>
    <String, dynamic>{
      'values': instance.values,
      'schema': instance.$type,
    };

_$TextAnswerImpl _$$TextAnswerImplFromJson(Map<String, dynamic> json) =>
    _$TextAnswerImpl(
      value: json['value'] as String,
      $type: json['schema'] as String?,
    );

Map<String, dynamic> _$$TextAnswerImplToJson(_$TextAnswerImpl instance) =>
    <String, dynamic>{
      'value': instance.value,
      'schema': instance.$type,
    };
