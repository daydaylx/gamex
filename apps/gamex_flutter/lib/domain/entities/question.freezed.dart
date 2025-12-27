// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'question.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

QuestionDependency _$QuestionDependencyFromJson(Map<String, dynamic> json) {
  return _QuestionDependency.fromJson(json);
}

/// @nodoc
mixin _$QuestionDependency {
  String get id => throw _privateConstructorUsedError;
  List<String> get values => throw _privateConstructorUsedError;

  /// Serializes this QuestionDependency to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of QuestionDependency
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $QuestionDependencyCopyWith<QuestionDependency> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $QuestionDependencyCopyWith<$Res> {
  factory $QuestionDependencyCopyWith(
          QuestionDependency value, $Res Function(QuestionDependency) then) =
      _$QuestionDependencyCopyWithImpl<$Res, QuestionDependency>;
  @useResult
  $Res call({String id, List<String> values});
}

/// @nodoc
class _$QuestionDependencyCopyWithImpl<$Res, $Val extends QuestionDependency>
    implements $QuestionDependencyCopyWith<$Res> {
  _$QuestionDependencyCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of QuestionDependency
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? values = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      values: null == values
          ? _value.values
          : values // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$QuestionDependencyImplCopyWith<$Res>
    implements $QuestionDependencyCopyWith<$Res> {
  factory _$$QuestionDependencyImplCopyWith(_$QuestionDependencyImpl value,
          $Res Function(_$QuestionDependencyImpl) then) =
      __$$QuestionDependencyImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({String id, List<String> values});
}

/// @nodoc
class __$$QuestionDependencyImplCopyWithImpl<$Res>
    extends _$QuestionDependencyCopyWithImpl<$Res, _$QuestionDependencyImpl>
    implements _$$QuestionDependencyImplCopyWith<$Res> {
  __$$QuestionDependencyImplCopyWithImpl(_$QuestionDependencyImpl _value,
      $Res Function(_$QuestionDependencyImpl) _then)
      : super(_value, _then);

  /// Create a copy of QuestionDependency
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? values = null,
  }) {
    return _then(_$QuestionDependencyImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      values: null == values
          ? _value._values
          : values // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$QuestionDependencyImpl implements _QuestionDependency {
  const _$QuestionDependencyImpl(
      {required this.id, final List<String> values = const <String>[]})
      : _values = values;

  factory _$QuestionDependencyImpl.fromJson(Map<String, dynamic> json) =>
      _$$QuestionDependencyImplFromJson(json);

  @override
  final String id;
  final List<String> _values;
  @override
  @JsonKey()
  List<String> get values {
    if (_values is EqualUnmodifiableListView) return _values;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_values);
  }

  @override
  String toString() {
    return 'QuestionDependency(id: $id, values: $values)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$QuestionDependencyImpl &&
            (identical(other.id, id) || other.id == id) &&
            const DeepCollectionEquality().equals(other._values, _values));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, id, const DeepCollectionEquality().hash(_values));

  /// Create a copy of QuestionDependency
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$QuestionDependencyImplCopyWith<_$QuestionDependencyImpl> get copyWith =>
      __$$QuestionDependencyImplCopyWithImpl<_$QuestionDependencyImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$QuestionDependencyImplToJson(
      this,
    );
  }
}

abstract class _QuestionDependency implements QuestionDependency {
  const factory _QuestionDependency(
      {required final String id,
      final List<String> values}) = _$QuestionDependencyImpl;

  factory _QuestionDependency.fromJson(Map<String, dynamic> json) =
      _$QuestionDependencyImpl.fromJson;

  @override
  String get id;
  @override
  List<String> get values;

  /// Create a copy of QuestionDependency
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$QuestionDependencyImplCopyWith<_$QuestionDependencyImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Question _$QuestionFromJson(Map<String, dynamic> json) {
  switch (json['schema']) {
    case 'consent_rating':
      return ConsentRatingQuestion.fromJson(json);
    case 'scale_1_10':
      return Scale1To10Question.fromJson(json);
    case 'enum':
      return EnumQuestion.fromJson(json);
    case 'multi':
      return MultiChoiceQuestion.fromJson(json);
    case 'text':
      return TextQuestion.fromJson(json);

    default:
      throw CheckedFromJsonException(json, 'schema', 'Question',
          'Invalid union type "${json['schema']}"!');
  }
}

/// @nodoc
mixin _$Question {
  String get id => throw _privateConstructorUsedError;
  @JsonKey(name: 'label', readValue: _readLabel)
  String get text => throw _privateConstructorUsedError;
  String? get help => throw _privateConstructorUsedError;
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  RiskLevel get riskLevel => throw _privateConstructorUsedError;
  List<String> get tags => throw _privateConstructorUsedError;
  @JsonKey(name: 'depends_on')
  QuestionDependency? get dependsOn => throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        consentRating,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        scale1To10,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        enumChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        multiChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)
        text,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingQuestion value) consentRating,
    required TResult Function(Scale1To10Question value) scale1To10,
    required TResult Function(EnumQuestion value) enumChoice,
    required TResult Function(MultiChoiceQuestion value) multiChoice,
    required TResult Function(TextQuestion value) text,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingQuestion value)? consentRating,
    TResult? Function(Scale1To10Question value)? scale1To10,
    TResult? Function(EnumQuestion value)? enumChoice,
    TResult? Function(MultiChoiceQuestion value)? multiChoice,
    TResult? Function(TextQuestion value)? text,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingQuestion value)? consentRating,
    TResult Function(Scale1To10Question value)? scale1To10,
    TResult Function(EnumQuestion value)? enumChoice,
    TResult Function(MultiChoiceQuestion value)? multiChoice,
    TResult Function(TextQuestion value)? text,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;

  /// Serializes this Question to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $QuestionCopyWith<Question> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $QuestionCopyWith<$Res> {
  factory $QuestionCopyWith(Question value, $Res Function(Question) then) =
      _$QuestionCopyWithImpl<$Res, Question>;
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'label', readValue: _readLabel) String text,
      String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      RiskLevel riskLevel,
      List<String> tags,
      @JsonKey(name: 'depends_on') QuestionDependency? dependsOn});

  $QuestionDependencyCopyWith<$Res>? get dependsOn;
}

/// @nodoc
class _$QuestionCopyWithImpl<$Res, $Val extends Question>
    implements $QuestionCopyWith<$Res> {
  _$QuestionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? text = null,
    Object? help = freezed,
    Object? riskLevel = null,
    Object? tags = null,
    Object? dependsOn = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
      help: freezed == help
          ? _value.help
          : help // ignore: cast_nullable_to_non_nullable
              as String?,
      riskLevel: null == riskLevel
          ? _value.riskLevel
          : riskLevel // ignore: cast_nullable_to_non_nullable
              as RiskLevel,
      tags: null == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      dependsOn: freezed == dependsOn
          ? _value.dependsOn
          : dependsOn // ignore: cast_nullable_to_non_nullable
              as QuestionDependency?,
    ) as $Val);
  }

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $QuestionDependencyCopyWith<$Res>? get dependsOn {
    if (_value.dependsOn == null) {
      return null;
    }

    return $QuestionDependencyCopyWith<$Res>(_value.dependsOn!, (value) {
      return _then(_value.copyWith(dependsOn: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$ConsentRatingQuestionImplCopyWith<$Res>
    implements $QuestionCopyWith<$Res> {
  factory _$$ConsentRatingQuestionImplCopyWith(
          _$ConsentRatingQuestionImpl value,
          $Res Function(_$ConsentRatingQuestionImpl) then) =
      __$$ConsentRatingQuestionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'label', readValue: _readLabel) String text,
      String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      RiskLevel riskLevel,
      List<String> tags,
      @JsonKey(name: 'depends_on') QuestionDependency? dependsOn});

  @override
  $QuestionDependencyCopyWith<$Res>? get dependsOn;
}

/// @nodoc
class __$$ConsentRatingQuestionImplCopyWithImpl<$Res>
    extends _$QuestionCopyWithImpl<$Res, _$ConsentRatingQuestionImpl>
    implements _$$ConsentRatingQuestionImplCopyWith<$Res> {
  __$$ConsentRatingQuestionImplCopyWithImpl(_$ConsentRatingQuestionImpl _value,
      $Res Function(_$ConsentRatingQuestionImpl) _then)
      : super(_value, _then);

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? text = null,
    Object? help = freezed,
    Object? riskLevel = null,
    Object? tags = null,
    Object? dependsOn = freezed,
  }) {
    return _then(_$ConsentRatingQuestionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
      help: freezed == help
          ? _value.help
          : help // ignore: cast_nullable_to_non_nullable
              as String?,
      riskLevel: null == riskLevel
          ? _value.riskLevel
          : riskLevel // ignore: cast_nullable_to_non_nullable
              as RiskLevel,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      dependsOn: freezed == dependsOn
          ? _value.dependsOn
          : dependsOn // ignore: cast_nullable_to_non_nullable
              as QuestionDependency?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ConsentRatingQuestionImpl extends ConsentRatingQuestion {
  const _$ConsentRatingQuestionImpl(
      {required this.id,
      @JsonKey(name: 'label', readValue: _readLabel) required this.text,
      this.help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      this.riskLevel = RiskLevel.low,
      final List<String> tags = const <String>[],
      @JsonKey(name: 'depends_on') this.dependsOn,
      final String? $type})
      : _tags = tags,
        $type = $type ?? 'consent_rating',
        super._();

  factory _$ConsentRatingQuestionImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConsentRatingQuestionImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  final String text;
  @override
  final String? help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  final RiskLevel riskLevel;
  final List<String> _tags;
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  @JsonKey(name: 'depends_on')
  final QuestionDependency? dependsOn;

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Question.consentRating(id: $id, text: $text, help: $help, riskLevel: $riskLevel, tags: $tags, dependsOn: $dependsOn)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConsentRatingQuestionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.text, text) || other.text == text) &&
            (identical(other.help, help) || other.help == help) &&
            (identical(other.riskLevel, riskLevel) ||
                other.riskLevel == riskLevel) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.dependsOn, dependsOn) ||
                other.dependsOn == dependsOn));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, text, help, riskLevel,
      const DeepCollectionEquality().hash(_tags), dependsOn);

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ConsentRatingQuestionImplCopyWith<_$ConsentRatingQuestionImpl>
      get copyWith => __$$ConsentRatingQuestionImplCopyWithImpl<
          _$ConsentRatingQuestionImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        consentRating,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        scale1To10,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        enumChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        multiChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)
        text,
  }) {
    return consentRating(id, this.text, help, riskLevel, tags, dependsOn);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
  }) {
    return consentRating?.call(id, this.text, help, riskLevel, tags, dependsOn);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
    required TResult orElse(),
  }) {
    if (consentRating != null) {
      return consentRating(id, this.text, help, riskLevel, tags, dependsOn);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingQuestion value) consentRating,
    required TResult Function(Scale1To10Question value) scale1To10,
    required TResult Function(EnumQuestion value) enumChoice,
    required TResult Function(MultiChoiceQuestion value) multiChoice,
    required TResult Function(TextQuestion value) text,
  }) {
    return consentRating(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingQuestion value)? consentRating,
    TResult? Function(Scale1To10Question value)? scale1To10,
    TResult? Function(EnumQuestion value)? enumChoice,
    TResult? Function(MultiChoiceQuestion value)? multiChoice,
    TResult? Function(TextQuestion value)? text,
  }) {
    return consentRating?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingQuestion value)? consentRating,
    TResult Function(Scale1To10Question value)? scale1To10,
    TResult Function(EnumQuestion value)? enumChoice,
    TResult Function(MultiChoiceQuestion value)? multiChoice,
    TResult Function(TextQuestion value)? text,
    required TResult orElse(),
  }) {
    if (consentRating != null) {
      return consentRating(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$ConsentRatingQuestionImplToJson(
      this,
    );
  }
}

abstract class ConsentRatingQuestion extends Question {
  const factory ConsentRatingQuestion(
      {required final String id,
      @JsonKey(name: 'label', readValue: _readLabel) required final String text,
      final String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      final RiskLevel riskLevel,
      final List<String> tags,
      @JsonKey(name: 'depends_on')
      final QuestionDependency? dependsOn}) = _$ConsentRatingQuestionImpl;
  const ConsentRatingQuestion._() : super._();

  factory ConsentRatingQuestion.fromJson(Map<String, dynamic> json) =
      _$ConsentRatingQuestionImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  String get text;
  @override
  String? get help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  RiskLevel get riskLevel;
  @override
  List<String> get tags;
  @override
  @JsonKey(name: 'depends_on')
  QuestionDependency? get dependsOn;

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ConsentRatingQuestionImplCopyWith<_$ConsentRatingQuestionImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$Scale1To10QuestionImplCopyWith<$Res>
    implements $QuestionCopyWith<$Res> {
  factory _$$Scale1To10QuestionImplCopyWith(_$Scale1To10QuestionImpl value,
          $Res Function(_$Scale1To10QuestionImpl) then) =
      __$$Scale1To10QuestionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'label', readValue: _readLabel) String text,
      String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      RiskLevel riskLevel,
      List<String> tags,
      @JsonKey(name: 'depends_on') QuestionDependency? dependsOn});

  @override
  $QuestionDependencyCopyWith<$Res>? get dependsOn;
}

/// @nodoc
class __$$Scale1To10QuestionImplCopyWithImpl<$Res>
    extends _$QuestionCopyWithImpl<$Res, _$Scale1To10QuestionImpl>
    implements _$$Scale1To10QuestionImplCopyWith<$Res> {
  __$$Scale1To10QuestionImplCopyWithImpl(_$Scale1To10QuestionImpl _value,
      $Res Function(_$Scale1To10QuestionImpl) _then)
      : super(_value, _then);

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? text = null,
    Object? help = freezed,
    Object? riskLevel = null,
    Object? tags = null,
    Object? dependsOn = freezed,
  }) {
    return _then(_$Scale1To10QuestionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
      help: freezed == help
          ? _value.help
          : help // ignore: cast_nullable_to_non_nullable
              as String?,
      riskLevel: null == riskLevel
          ? _value.riskLevel
          : riskLevel // ignore: cast_nullable_to_non_nullable
              as RiskLevel,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      dependsOn: freezed == dependsOn
          ? _value.dependsOn
          : dependsOn // ignore: cast_nullable_to_non_nullable
              as QuestionDependency?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$Scale1To10QuestionImpl extends Scale1To10Question {
  const _$Scale1To10QuestionImpl(
      {required this.id,
      @JsonKey(name: 'label', readValue: _readLabel) required this.text,
      this.help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      this.riskLevel = RiskLevel.low,
      final List<String> tags = const <String>[],
      @JsonKey(name: 'depends_on') this.dependsOn,
      final String? $type})
      : _tags = tags,
        $type = $type ?? 'scale_1_10',
        super._();

  factory _$Scale1To10QuestionImpl.fromJson(Map<String, dynamic> json) =>
      _$$Scale1To10QuestionImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  final String text;
  @override
  final String? help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  final RiskLevel riskLevel;
  final List<String> _tags;
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  @JsonKey(name: 'depends_on')
  final QuestionDependency? dependsOn;

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Question.scale1To10(id: $id, text: $text, help: $help, riskLevel: $riskLevel, tags: $tags, dependsOn: $dependsOn)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$Scale1To10QuestionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.text, text) || other.text == text) &&
            (identical(other.help, help) || other.help == help) &&
            (identical(other.riskLevel, riskLevel) ||
                other.riskLevel == riskLevel) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.dependsOn, dependsOn) ||
                other.dependsOn == dependsOn));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, text, help, riskLevel,
      const DeepCollectionEquality().hash(_tags), dependsOn);

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$Scale1To10QuestionImplCopyWith<_$Scale1To10QuestionImpl> get copyWith =>
      __$$Scale1To10QuestionImplCopyWithImpl<_$Scale1To10QuestionImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        consentRating,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        scale1To10,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        enumChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        multiChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)
        text,
  }) {
    return scale1To10(id, this.text, help, riskLevel, tags, dependsOn);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
  }) {
    return scale1To10?.call(id, this.text, help, riskLevel, tags, dependsOn);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
    required TResult orElse(),
  }) {
    if (scale1To10 != null) {
      return scale1To10(id, this.text, help, riskLevel, tags, dependsOn);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingQuestion value) consentRating,
    required TResult Function(Scale1To10Question value) scale1To10,
    required TResult Function(EnumQuestion value) enumChoice,
    required TResult Function(MultiChoiceQuestion value) multiChoice,
    required TResult Function(TextQuestion value) text,
  }) {
    return scale1To10(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingQuestion value)? consentRating,
    TResult? Function(Scale1To10Question value)? scale1To10,
    TResult? Function(EnumQuestion value)? enumChoice,
    TResult? Function(MultiChoiceQuestion value)? multiChoice,
    TResult? Function(TextQuestion value)? text,
  }) {
    return scale1To10?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingQuestion value)? consentRating,
    TResult Function(Scale1To10Question value)? scale1To10,
    TResult Function(EnumQuestion value)? enumChoice,
    TResult Function(MultiChoiceQuestion value)? multiChoice,
    TResult Function(TextQuestion value)? text,
    required TResult orElse(),
  }) {
    if (scale1To10 != null) {
      return scale1To10(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$Scale1To10QuestionImplToJson(
      this,
    );
  }
}

abstract class Scale1To10Question extends Question {
  const factory Scale1To10Question(
      {required final String id,
      @JsonKey(name: 'label', readValue: _readLabel) required final String text,
      final String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      final RiskLevel riskLevel,
      final List<String> tags,
      @JsonKey(name: 'depends_on')
      final QuestionDependency? dependsOn}) = _$Scale1To10QuestionImpl;
  const Scale1To10Question._() : super._();

  factory Scale1To10Question.fromJson(Map<String, dynamic> json) =
      _$Scale1To10QuestionImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  String get text;
  @override
  String? get help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  RiskLevel get riskLevel;
  @override
  List<String> get tags;
  @override
  @JsonKey(name: 'depends_on')
  QuestionDependency? get dependsOn;

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$Scale1To10QuestionImplCopyWith<_$Scale1To10QuestionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$EnumQuestionImplCopyWith<$Res>
    implements $QuestionCopyWith<$Res> {
  factory _$$EnumQuestionImplCopyWith(
          _$EnumQuestionImpl value, $Res Function(_$EnumQuestionImpl) then) =
      __$$EnumQuestionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'label', readValue: _readLabel) String text,
      String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      RiskLevel riskLevel,
      List<String> tags,
      @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
      List<String> options});

  @override
  $QuestionDependencyCopyWith<$Res>? get dependsOn;
}

/// @nodoc
class __$$EnumQuestionImplCopyWithImpl<$Res>
    extends _$QuestionCopyWithImpl<$Res, _$EnumQuestionImpl>
    implements _$$EnumQuestionImplCopyWith<$Res> {
  __$$EnumQuestionImplCopyWithImpl(
      _$EnumQuestionImpl _value, $Res Function(_$EnumQuestionImpl) _then)
      : super(_value, _then);

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? text = null,
    Object? help = freezed,
    Object? riskLevel = null,
    Object? tags = null,
    Object? dependsOn = freezed,
    Object? options = null,
  }) {
    return _then(_$EnumQuestionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
      help: freezed == help
          ? _value.help
          : help // ignore: cast_nullable_to_non_nullable
              as String?,
      riskLevel: null == riskLevel
          ? _value.riskLevel
          : riskLevel // ignore: cast_nullable_to_non_nullable
              as RiskLevel,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      dependsOn: freezed == dependsOn
          ? _value.dependsOn
          : dependsOn // ignore: cast_nullable_to_non_nullable
              as QuestionDependency?,
      options: null == options
          ? _value._options
          : options // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$EnumQuestionImpl extends EnumQuestion {
  const _$EnumQuestionImpl(
      {required this.id,
      @JsonKey(name: 'label', readValue: _readLabel) required this.text,
      this.help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      this.riskLevel = RiskLevel.low,
      final List<String> tags = const <String>[],
      @JsonKey(name: 'depends_on') this.dependsOn,
      final List<String> options = const <String>[],
      final String? $type})
      : _tags = tags,
        _options = options,
        $type = $type ?? 'enum',
        super._();

  factory _$EnumQuestionImpl.fromJson(Map<String, dynamic> json) =>
      _$$EnumQuestionImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  final String text;
  @override
  final String? help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  final RiskLevel riskLevel;
  final List<String> _tags;
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  @JsonKey(name: 'depends_on')
  final QuestionDependency? dependsOn;
  final List<String> _options;
  @override
  @JsonKey()
  List<String> get options {
    if (_options is EqualUnmodifiableListView) return _options;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_options);
  }

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Question.enumChoice(id: $id, text: $text, help: $help, riskLevel: $riskLevel, tags: $tags, dependsOn: $dependsOn, options: $options)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EnumQuestionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.text, text) || other.text == text) &&
            (identical(other.help, help) || other.help == help) &&
            (identical(other.riskLevel, riskLevel) ||
                other.riskLevel == riskLevel) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.dependsOn, dependsOn) ||
                other.dependsOn == dependsOn) &&
            const DeepCollectionEquality().equals(other._options, _options));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      text,
      help,
      riskLevel,
      const DeepCollectionEquality().hash(_tags),
      dependsOn,
      const DeepCollectionEquality().hash(_options));

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EnumQuestionImplCopyWith<_$EnumQuestionImpl> get copyWith =>
      __$$EnumQuestionImplCopyWithImpl<_$EnumQuestionImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        consentRating,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        scale1To10,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        enumChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        multiChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)
        text,
  }) {
    return enumChoice(id, this.text, help, riskLevel, tags, dependsOn, options);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
  }) {
    return enumChoice?.call(
        id, this.text, help, riskLevel, tags, dependsOn, options);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
    required TResult orElse(),
  }) {
    if (enumChoice != null) {
      return enumChoice(
          id, this.text, help, riskLevel, tags, dependsOn, options);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingQuestion value) consentRating,
    required TResult Function(Scale1To10Question value) scale1To10,
    required TResult Function(EnumQuestion value) enumChoice,
    required TResult Function(MultiChoiceQuestion value) multiChoice,
    required TResult Function(TextQuestion value) text,
  }) {
    return enumChoice(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingQuestion value)? consentRating,
    TResult? Function(Scale1To10Question value)? scale1To10,
    TResult? Function(EnumQuestion value)? enumChoice,
    TResult? Function(MultiChoiceQuestion value)? multiChoice,
    TResult? Function(TextQuestion value)? text,
  }) {
    return enumChoice?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingQuestion value)? consentRating,
    TResult Function(Scale1To10Question value)? scale1To10,
    TResult Function(EnumQuestion value)? enumChoice,
    TResult Function(MultiChoiceQuestion value)? multiChoice,
    TResult Function(TextQuestion value)? text,
    required TResult orElse(),
  }) {
    if (enumChoice != null) {
      return enumChoice(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$EnumQuestionImplToJson(
      this,
    );
  }
}

abstract class EnumQuestion extends Question {
  const factory EnumQuestion(
      {required final String id,
      @JsonKey(name: 'label', readValue: _readLabel) required final String text,
      final String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      final RiskLevel riskLevel,
      final List<String> tags,
      @JsonKey(name: 'depends_on') final QuestionDependency? dependsOn,
      final List<String> options}) = _$EnumQuestionImpl;
  const EnumQuestion._() : super._();

  factory EnumQuestion.fromJson(Map<String, dynamic> json) =
      _$EnumQuestionImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  String get text;
  @override
  String? get help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  RiskLevel get riskLevel;
  @override
  List<String> get tags;
  @override
  @JsonKey(name: 'depends_on')
  QuestionDependency? get dependsOn;
  List<String> get options;

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EnumQuestionImplCopyWith<_$EnumQuestionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$MultiChoiceQuestionImplCopyWith<$Res>
    implements $QuestionCopyWith<$Res> {
  factory _$$MultiChoiceQuestionImplCopyWith(_$MultiChoiceQuestionImpl value,
          $Res Function(_$MultiChoiceQuestionImpl) then) =
      __$$MultiChoiceQuestionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'label', readValue: _readLabel) String text,
      String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      RiskLevel riskLevel,
      List<String> tags,
      @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
      List<String> options});

  @override
  $QuestionDependencyCopyWith<$Res>? get dependsOn;
}

/// @nodoc
class __$$MultiChoiceQuestionImplCopyWithImpl<$Res>
    extends _$QuestionCopyWithImpl<$Res, _$MultiChoiceQuestionImpl>
    implements _$$MultiChoiceQuestionImplCopyWith<$Res> {
  __$$MultiChoiceQuestionImplCopyWithImpl(_$MultiChoiceQuestionImpl _value,
      $Res Function(_$MultiChoiceQuestionImpl) _then)
      : super(_value, _then);

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? text = null,
    Object? help = freezed,
    Object? riskLevel = null,
    Object? tags = null,
    Object? dependsOn = freezed,
    Object? options = null,
  }) {
    return _then(_$MultiChoiceQuestionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
      help: freezed == help
          ? _value.help
          : help // ignore: cast_nullable_to_non_nullable
              as String?,
      riskLevel: null == riskLevel
          ? _value.riskLevel
          : riskLevel // ignore: cast_nullable_to_non_nullable
              as RiskLevel,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      dependsOn: freezed == dependsOn
          ? _value.dependsOn
          : dependsOn // ignore: cast_nullable_to_non_nullable
              as QuestionDependency?,
      options: null == options
          ? _value._options
          : options // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$MultiChoiceQuestionImpl extends MultiChoiceQuestion {
  const _$MultiChoiceQuestionImpl(
      {required this.id,
      @JsonKey(name: 'label', readValue: _readLabel) required this.text,
      this.help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      this.riskLevel = RiskLevel.low,
      final List<String> tags = const <String>[],
      @JsonKey(name: 'depends_on') this.dependsOn,
      final List<String> options = const <String>[],
      final String? $type})
      : _tags = tags,
        _options = options,
        $type = $type ?? 'multi',
        super._();

  factory _$MultiChoiceQuestionImpl.fromJson(Map<String, dynamic> json) =>
      _$$MultiChoiceQuestionImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  final String text;
  @override
  final String? help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  final RiskLevel riskLevel;
  final List<String> _tags;
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  @JsonKey(name: 'depends_on')
  final QuestionDependency? dependsOn;
  final List<String> _options;
  @override
  @JsonKey()
  List<String> get options {
    if (_options is EqualUnmodifiableListView) return _options;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_options);
  }

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Question.multiChoice(id: $id, text: $text, help: $help, riskLevel: $riskLevel, tags: $tags, dependsOn: $dependsOn, options: $options)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MultiChoiceQuestionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.text, text) || other.text == text) &&
            (identical(other.help, help) || other.help == help) &&
            (identical(other.riskLevel, riskLevel) ||
                other.riskLevel == riskLevel) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.dependsOn, dependsOn) ||
                other.dependsOn == dependsOn) &&
            const DeepCollectionEquality().equals(other._options, _options));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      text,
      help,
      riskLevel,
      const DeepCollectionEquality().hash(_tags),
      dependsOn,
      const DeepCollectionEquality().hash(_options));

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MultiChoiceQuestionImplCopyWith<_$MultiChoiceQuestionImpl> get copyWith =>
      __$$MultiChoiceQuestionImplCopyWithImpl<_$MultiChoiceQuestionImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        consentRating,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        scale1To10,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        enumChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        multiChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)
        text,
  }) {
    return multiChoice(
        id, this.text, help, riskLevel, tags, dependsOn, options);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
  }) {
    return multiChoice?.call(
        id, this.text, help, riskLevel, tags, dependsOn, options);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
    required TResult orElse(),
  }) {
    if (multiChoice != null) {
      return multiChoice(
          id, this.text, help, riskLevel, tags, dependsOn, options);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingQuestion value) consentRating,
    required TResult Function(Scale1To10Question value) scale1To10,
    required TResult Function(EnumQuestion value) enumChoice,
    required TResult Function(MultiChoiceQuestion value) multiChoice,
    required TResult Function(TextQuestion value) text,
  }) {
    return multiChoice(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingQuestion value)? consentRating,
    TResult? Function(Scale1To10Question value)? scale1To10,
    TResult? Function(EnumQuestion value)? enumChoice,
    TResult? Function(MultiChoiceQuestion value)? multiChoice,
    TResult? Function(TextQuestion value)? text,
  }) {
    return multiChoice?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingQuestion value)? consentRating,
    TResult Function(Scale1To10Question value)? scale1To10,
    TResult Function(EnumQuestion value)? enumChoice,
    TResult Function(MultiChoiceQuestion value)? multiChoice,
    TResult Function(TextQuestion value)? text,
    required TResult orElse(),
  }) {
    if (multiChoice != null) {
      return multiChoice(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$MultiChoiceQuestionImplToJson(
      this,
    );
  }
}

abstract class MultiChoiceQuestion extends Question {
  const factory MultiChoiceQuestion(
      {required final String id,
      @JsonKey(name: 'label', readValue: _readLabel) required final String text,
      final String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      final RiskLevel riskLevel,
      final List<String> tags,
      @JsonKey(name: 'depends_on') final QuestionDependency? dependsOn,
      final List<String> options}) = _$MultiChoiceQuestionImpl;
  const MultiChoiceQuestion._() : super._();

  factory MultiChoiceQuestion.fromJson(Map<String, dynamic> json) =
      _$MultiChoiceQuestionImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  String get text;
  @override
  String? get help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  RiskLevel get riskLevel;
  @override
  List<String> get tags;
  @override
  @JsonKey(name: 'depends_on')
  QuestionDependency? get dependsOn;
  List<String> get options;

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MultiChoiceQuestionImplCopyWith<_$MultiChoiceQuestionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$TextQuestionImplCopyWith<$Res>
    implements $QuestionCopyWith<$Res> {
  factory _$$TextQuestionImplCopyWith(
          _$TextQuestionImpl value, $Res Function(_$TextQuestionImpl) then) =
      __$$TextQuestionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      @JsonKey(name: 'label', readValue: _readLabel) String text,
      String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      RiskLevel riskLevel,
      List<String> tags,
      @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
      String? placeholder});

  @override
  $QuestionDependencyCopyWith<$Res>? get dependsOn;
}

/// @nodoc
class __$$TextQuestionImplCopyWithImpl<$Res>
    extends _$QuestionCopyWithImpl<$Res, _$TextQuestionImpl>
    implements _$$TextQuestionImplCopyWith<$Res> {
  __$$TextQuestionImplCopyWithImpl(
      _$TextQuestionImpl _value, $Res Function(_$TextQuestionImpl) _then)
      : super(_value, _then);

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? text = null,
    Object? help = freezed,
    Object? riskLevel = null,
    Object? tags = null,
    Object? dependsOn = freezed,
    Object? placeholder = freezed,
  }) {
    return _then(_$TextQuestionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      text: null == text
          ? _value.text
          : text // ignore: cast_nullable_to_non_nullable
              as String,
      help: freezed == help
          ? _value.help
          : help // ignore: cast_nullable_to_non_nullable
              as String?,
      riskLevel: null == riskLevel
          ? _value.riskLevel
          : riskLevel // ignore: cast_nullable_to_non_nullable
              as RiskLevel,
      tags: null == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>,
      dependsOn: freezed == dependsOn
          ? _value.dependsOn
          : dependsOn // ignore: cast_nullable_to_non_nullable
              as QuestionDependency?,
      placeholder: freezed == placeholder
          ? _value.placeholder
          : placeholder // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TextQuestionImpl extends TextQuestion {
  const _$TextQuestionImpl(
      {required this.id,
      @JsonKey(name: 'label', readValue: _readLabel) required this.text,
      this.help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      this.riskLevel = RiskLevel.low,
      final List<String> tags = const <String>[],
      @JsonKey(name: 'depends_on') this.dependsOn,
      this.placeholder,
      final String? $type})
      : _tags = tags,
        $type = $type ?? 'text',
        super._();

  factory _$TextQuestionImpl.fromJson(Map<String, dynamic> json) =>
      _$$TextQuestionImplFromJson(json);

  @override
  final String id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  final String text;
  @override
  final String? help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  final RiskLevel riskLevel;
  final List<String> _tags;
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  @JsonKey(name: 'depends_on')
  final QuestionDependency? dependsOn;
  @override
  final String? placeholder;

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Question.text(id: $id, text: $text, help: $help, riskLevel: $riskLevel, tags: $tags, dependsOn: $dependsOn, placeholder: $placeholder)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TextQuestionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.text, text) || other.text == text) &&
            (identical(other.help, help) || other.help == help) &&
            (identical(other.riskLevel, riskLevel) ||
                other.riskLevel == riskLevel) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.dependsOn, dependsOn) ||
                other.dependsOn == dependsOn) &&
            (identical(other.placeholder, placeholder) ||
                other.placeholder == placeholder));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, text, help, riskLevel,
      const DeepCollectionEquality().hash(_tags), dependsOn, placeholder);

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TextQuestionImplCopyWith<_$TextQuestionImpl> get copyWith =>
      __$$TextQuestionImplCopyWithImpl<_$TextQuestionImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        consentRating,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)
        scale1To10,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        enumChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)
        multiChoice,
    required TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)
        text,
  }) {
    return text(id, this.text, help, riskLevel, tags, dependsOn, placeholder);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult? Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
  }) {
    return text?.call(
        id, this.text, help, riskLevel, tags, dependsOn, placeholder);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        consentRating,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn)?
        scale1To10,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        enumChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            List<String> options)?
        multiChoice,
    TResult Function(
            String id,
            @JsonKey(name: 'label', readValue: _readLabel) String text,
            String? help,
            @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
            RiskLevel riskLevel,
            List<String> tags,
            @JsonKey(name: 'depends_on') QuestionDependency? dependsOn,
            String? placeholder)?
        text,
    required TResult orElse(),
  }) {
    if (text != null) {
      return text(id, this.text, help, riskLevel, tags, dependsOn, placeholder);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingQuestion value) consentRating,
    required TResult Function(Scale1To10Question value) scale1To10,
    required TResult Function(EnumQuestion value) enumChoice,
    required TResult Function(MultiChoiceQuestion value) multiChoice,
    required TResult Function(TextQuestion value) text,
  }) {
    return text(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingQuestion value)? consentRating,
    TResult? Function(Scale1To10Question value)? scale1To10,
    TResult? Function(EnumQuestion value)? enumChoice,
    TResult? Function(MultiChoiceQuestion value)? multiChoice,
    TResult? Function(TextQuestion value)? text,
  }) {
    return text?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingQuestion value)? consentRating,
    TResult Function(Scale1To10Question value)? scale1To10,
    TResult Function(EnumQuestion value)? enumChoice,
    TResult Function(MultiChoiceQuestion value)? multiChoice,
    TResult Function(TextQuestion value)? text,
    required TResult orElse(),
  }) {
    if (text != null) {
      return text(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$TextQuestionImplToJson(
      this,
    );
  }
}

abstract class TextQuestion extends Question {
  const factory TextQuestion(
      {required final String id,
      @JsonKey(name: 'label', readValue: _readLabel) required final String text,
      final String? help,
      @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
      final RiskLevel riskLevel,
      final List<String> tags,
      @JsonKey(name: 'depends_on') final QuestionDependency? dependsOn,
      final String? placeholder}) = _$TextQuestionImpl;
  const TextQuestion._() : super._();

  factory TextQuestion.fromJson(Map<String, dynamic> json) =
      _$TextQuestionImpl.fromJson;

  @override
  String get id;
  @override
  @JsonKey(name: 'label', readValue: _readLabel)
  String get text;
  @override
  String? get help;
  @override
  @JsonKey(name: 'risk_level', readValue: _readRiskLevel)
  RiskLevel get riskLevel;
  @override
  List<String> get tags;
  @override
  @JsonKey(name: 'depends_on')
  QuestionDependency? get dependsOn;
  String? get placeholder;

  /// Create a copy of Question
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TextQuestionImplCopyWith<_$TextQuestionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
