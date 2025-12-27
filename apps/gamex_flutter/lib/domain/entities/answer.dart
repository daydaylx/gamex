import 'package:freezed_annotation/freezed_annotation.dart';

part 'answer.freezed.dart';
part 'answer.g.dart';

enum ConsentStatus {
  @JsonValue('YES')
  yes,
  @JsonValue('MAYBE')
  maybe,
  @JsonValue('NO')
  no,
  @JsonValue('HARD_LIMIT')
  hardLimit,
}

@Freezed(unionKey: 'schema')
class Answer with _$Answer {
  const Answer._();

  @FreezedUnionValue('consent_rating')
  const factory Answer.consentRating({
    required ConsentStatus status,
    @Default(0) int intensity,
  }) = ConsentRatingAnswer;

  @FreezedUnionValue('scale_1_10')
  const factory Answer.scale1To10({
    required int value,
  }) = Scale1To10Answer;

  @FreezedUnionValue('enum')
  const factory Answer.enumChoice({
    @JsonKey(name: 'value') required String value,
  }) = EnumAnswer;

  @FreezedUnionValue('multi')
  const factory Answer.multiChoice({
    @JsonKey(name: 'values') @Default(<String>[]) List<String> values,
  }) = MultiChoiceAnswer;

  @FreezedUnionValue('text')
  const factory Answer.text({
    @JsonKey(name: 'text') required String text,
  }) = TextAnswer;

  factory Answer.fromJson(Map<String, dynamic> json) =>
      _$AnswerFromJson(json);
}
