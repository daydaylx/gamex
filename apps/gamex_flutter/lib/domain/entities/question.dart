import 'package:freezed_annotation/freezed_annotation.dart';

part 'question.freezed.dart';
part 'question.g.dart';

enum RiskLevel {
  @JsonValue('A')
  low,
  @JsonValue('B')
  medium,
  @JsonValue('C')
  high,
}

@freezed
class QuestionDependency with _$QuestionDependency {
  const factory QuestionDependency({
    required String id,
    @Default(<String>[]) List<String> values,
  }) = _QuestionDependency;

  factory QuestionDependency.fromJson(Map<String, dynamic> json) =>
      _$QuestionDependencyFromJson(json);
}

@Freezed(unionKey: 'schema')
class Question with _$Question {
  const Question._();

  @FreezedUnionValue('consent_rating')
  const factory Question.consentRating({
    required String id,
    @JsonKey(name: 'label', readValue: _readLabel) required String text,
    String? help,
    @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
    @Default(RiskLevel.low)
    RiskLevel riskLevel,
    @Default(<String>[]) List<String> tags,
    @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
  }) = ConsentRatingQuestion;

  @FreezedUnionValue('scale_1_10')
  const factory Question.scale1To10({
    required String id,
    @JsonKey(name: 'label', readValue: _readLabel) required String text,
    String? help,
    @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
    @Default(RiskLevel.low)
    RiskLevel riskLevel,
    @Default(<String>[]) List<String> tags,
    @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
  }) = Scale1To10Question;

  @FreezedUnionValue('enum')
  const factory Question.enumChoice({
    required String id,
    @JsonKey(name: 'label', readValue: _readLabel) required String text,
    String? help,
    @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
    @Default(RiskLevel.low)
    RiskLevel riskLevel,
    @Default(<String>[]) List<String> tags,
    @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
    @Default(<String>[]) List<String> options,
  }) = EnumQuestion;

  @FreezedUnionValue('multi')
  const factory Question.multiChoice({
    required String id,
    @JsonKey(name: 'label', readValue: _readLabel) required String text,
    String? help,
    @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
    @Default(RiskLevel.low)
    RiskLevel riskLevel,
    @Default(<String>[]) List<String> tags,
    @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
    @Default(<String>[]) List<String> options,
  }) = MultiChoiceQuestion;

  @FreezedUnionValue('text')
  const factory Question.text({
    required String id,
    @JsonKey(name: 'label', readValue: _readLabel) required String text,
    String? help,
    @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
    @Default(RiskLevel.low)
    RiskLevel riskLevel,
    @Default(<String>[]) List<String> tags,
    @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
    String? placeholder,
  }) = TextQuestion;

  factory Question.fromJson(Map<String, dynamic> json) =>
      _$QuestionFromJson(json);
}

Object? _readLabel(Map json, String key) {
  return json['label'] ?? json['text'];
}

Object? _readRiskLevel(Map json, String key) {
  return json['risk_level'] ?? json['risk'];
}
