// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'answer.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Answer _$AnswerFromJson(Map<String, dynamic> json) {
  switch (json['schema']) {
    case 'consent_rating':
      return ConsentRatingAnswer.fromJson(json);
    case 'scale_1_10':
      return Scale1To10Answer.fromJson(json);
    case 'enum':
      return EnumAnswer.fromJson(json);
    case 'multi':
      return MultiChoiceAnswer.fromJson(json);
    case 'text':
      return TextAnswer.fromJson(json);

    default:
      throw CheckedFromJsonException(
          json, 'schema', 'Answer', 'Invalid union type "${json['schema']}"!');
  }
}

/// @nodoc
mixin _$Answer {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(ConsentStatus status, int intensity)
        consentRating,
    required TResult Function(int value) scale1To10,
    required TResult Function(String option) enumChoice,
    required TResult Function(List<String> values) multiChoice,
    required TResult Function(String value) text,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(ConsentStatus status, int intensity)? consentRating,
    TResult? Function(int value)? scale1To10,
    TResult? Function(String option)? enumChoice,
    TResult? Function(List<String> values)? multiChoice,
    TResult? Function(String value)? text,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(ConsentStatus status, int intensity)? consentRating,
    TResult Function(int value)? scale1To10,
    TResult Function(String option)? enumChoice,
    TResult Function(List<String> values)? multiChoice,
    TResult Function(String value)? text,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingAnswer value) consentRating,
    required TResult Function(Scale1To10Answer value) scale1To10,
    required TResult Function(EnumAnswer value) enumChoice,
    required TResult Function(MultiChoiceAnswer value) multiChoice,
    required TResult Function(TextAnswer value) text,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingAnswer value)? consentRating,
    TResult? Function(Scale1To10Answer value)? scale1To10,
    TResult? Function(EnumAnswer value)? enumChoice,
    TResult? Function(MultiChoiceAnswer value)? multiChoice,
    TResult? Function(TextAnswer value)? text,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingAnswer value)? consentRating,
    TResult Function(Scale1To10Answer value)? scale1To10,
    TResult Function(EnumAnswer value)? enumChoice,
    TResult Function(MultiChoiceAnswer value)? multiChoice,
    TResult Function(TextAnswer value)? text,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;

  /// Serializes this Answer to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AnswerCopyWith<$Res> {
  factory $AnswerCopyWith(Answer value, $Res Function(Answer) then) =
      _$AnswerCopyWithImpl<$Res, Answer>;
}

/// @nodoc
class _$AnswerCopyWithImpl<$Res, $Val extends Answer>
    implements $AnswerCopyWith<$Res> {
  _$AnswerCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
}

/// @nodoc
abstract class _$$ConsentRatingAnswerImplCopyWith<$Res> {
  factory _$$ConsentRatingAnswerImplCopyWith(_$ConsentRatingAnswerImpl value,
          $Res Function(_$ConsentRatingAnswerImpl) then) =
      __$$ConsentRatingAnswerImplCopyWithImpl<$Res>;
  @useResult
  $Res call({ConsentStatus status, int intensity});
}

/// @nodoc
class __$$ConsentRatingAnswerImplCopyWithImpl<$Res>
    extends _$AnswerCopyWithImpl<$Res, _$ConsentRatingAnswerImpl>
    implements _$$ConsentRatingAnswerImplCopyWith<$Res> {
  __$$ConsentRatingAnswerImplCopyWithImpl(_$ConsentRatingAnswerImpl _value,
      $Res Function(_$ConsentRatingAnswerImpl) _then)
      : super(_value, _then);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? intensity = null,
  }) {
    return _then(_$ConsentRatingAnswerImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as ConsentStatus,
      intensity: null == intensity
          ? _value.intensity
          : intensity // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ConsentRatingAnswerImpl extends ConsentRatingAnswer {
  const _$ConsentRatingAnswerImpl(
      {required this.status, this.intensity = 0, final String? $type})
      : $type = $type ?? 'consent_rating',
        super._();

  factory _$ConsentRatingAnswerImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConsentRatingAnswerImplFromJson(json);

  @override
  final ConsentStatus status;
  @override
  @JsonKey()
  final int intensity;

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Answer.consentRating(status: $status, intensity: $intensity)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConsentRatingAnswerImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.intensity, intensity) ||
                other.intensity == intensity));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, status, intensity);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$ConsentRatingAnswerImplCopyWith<_$ConsentRatingAnswerImpl> get copyWith =>
      __$$ConsentRatingAnswerImplCopyWithImpl<_$ConsentRatingAnswerImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(ConsentStatus status, int intensity)
        consentRating,
    required TResult Function(int value) scale1To10,
    required TResult Function(String option) enumChoice,
    required TResult Function(List<String> values) multiChoice,
    required TResult Function(String value) text,
  }) {
    return consentRating(status, intensity);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(ConsentStatus status, int intensity)? consentRating,
    TResult? Function(int value)? scale1To10,
    TResult? Function(String option)? enumChoice,
    TResult? Function(List<String> values)? multiChoice,
    TResult? Function(String value)? text,
  }) {
    return consentRating?.call(status, intensity);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(ConsentStatus status, int intensity)? consentRating,
    TResult Function(int value)? scale1To10,
    TResult Function(String option)? enumChoice,
    TResult Function(List<String> values)? multiChoice,
    TResult Function(String value)? text,
    required TResult orElse(),
  }) {
    if (consentRating != null) {
      return consentRating(status, intensity);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingAnswer value) consentRating,
    required TResult Function(Scale1To10Answer value) scale1To10,
    required TResult Function(EnumAnswer value) enumChoice,
    required TResult Function(MultiChoiceAnswer value) multiChoice,
    required TResult Function(TextAnswer value) text,
  }) {
    return consentRating(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingAnswer value)? consentRating,
    TResult? Function(Scale1To10Answer value)? scale1To10,
    TResult? Function(EnumAnswer value)? enumChoice,
    TResult? Function(MultiChoiceAnswer value)? multiChoice,
    TResult? Function(TextAnswer value)? text,
  }) {
    return consentRating?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingAnswer value)? consentRating,
    TResult Function(Scale1To10Answer value)? scale1To10,
    TResult Function(EnumAnswer value)? enumChoice,
    TResult Function(MultiChoiceAnswer value)? multiChoice,
    TResult Function(TextAnswer value)? text,
    required TResult orElse(),
  }) {
    if (consentRating != null) {
      return consentRating(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$ConsentRatingAnswerImplToJson(
      this,
    );
  }
}

abstract class ConsentRatingAnswer extends Answer {
  const factory ConsentRatingAnswer(
      {required final ConsentStatus status,
      final int intensity}) = _$ConsentRatingAnswerImpl;
  const ConsentRatingAnswer._() : super._();

  factory ConsentRatingAnswer.fromJson(Map<String, dynamic> json) =
      _$ConsentRatingAnswerImpl.fromJson;

  ConsentStatus get status;
  int get intensity;

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ConsentRatingAnswerImplCopyWith<_$ConsentRatingAnswerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$Scale1To10AnswerImplCopyWith<$Res> {
  factory _$$Scale1To10AnswerImplCopyWith(_$Scale1To10AnswerImpl value,
          $Res Function(_$Scale1To10AnswerImpl) then) =
      __$$Scale1To10AnswerImplCopyWithImpl<$Res>;
  @useResult
  $Res call({int value});
}

/// @nodoc
class __$$Scale1To10AnswerImplCopyWithImpl<$Res>
    extends _$AnswerCopyWithImpl<$Res, _$Scale1To10AnswerImpl>
    implements _$$Scale1To10AnswerImplCopyWith<$Res> {
  __$$Scale1To10AnswerImplCopyWithImpl(_$Scale1To10AnswerImpl _value,
      $Res Function(_$Scale1To10AnswerImpl) _then)
      : super(_value, _then);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? value = null,
  }) {
    return _then(_$Scale1To10AnswerImpl(
      value: null == value
          ? _value.value
          : value // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$Scale1To10AnswerImpl extends Scale1To10Answer {
  const _$Scale1To10AnswerImpl({required this.value, final String? $type})
      : $type = $type ?? 'scale_1_10',
        super._();

  factory _$Scale1To10AnswerImpl.fromJson(Map<String, dynamic> json) =>
      _$$Scale1To10AnswerImplFromJson(json);

  @override
  final int value;

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Answer.scale1To10(value: $value)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$Scale1To10AnswerImpl &&
            (identical(other.value, value) || other.value == value));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, value);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$Scale1To10AnswerImplCopyWith<_$Scale1To10AnswerImpl> get copyWith =>
      __$$Scale1To10AnswerImplCopyWithImpl<_$Scale1To10AnswerImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(ConsentStatus status, int intensity)
        consentRating,
    required TResult Function(int value) scale1To10,
    required TResult Function(String option) enumChoice,
    required TResult Function(List<String> values) multiChoice,
    required TResult Function(String value) text,
  }) {
    return scale1To10(value);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(ConsentStatus status, int intensity)? consentRating,
    TResult? Function(int value)? scale1To10,
    TResult? Function(String option)? enumChoice,
    TResult? Function(List<String> values)? multiChoice,
    TResult? Function(String value)? text,
  }) {
    return scale1To10?.call(value);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(ConsentStatus status, int intensity)? consentRating,
    TResult Function(int value)? scale1To10,
    TResult Function(String option)? enumChoice,
    TResult Function(List<String> values)? multiChoice,
    TResult Function(String value)? text,
    required TResult orElse(),
  }) {
    if (scale1To10 != null) {
      return scale1To10(value);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingAnswer value) consentRating,
    required TResult Function(Scale1To10Answer value) scale1To10,
    required TResult Function(EnumAnswer value) enumChoice,
    required TResult Function(MultiChoiceAnswer value) multiChoice,
    required TResult Function(TextAnswer value) text,
  }) {
    return scale1To10(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingAnswer value)? consentRating,
    TResult? Function(Scale1To10Answer value)? scale1To10,
    TResult? Function(EnumAnswer value)? enumChoice,
    TResult? Function(MultiChoiceAnswer value)? multiChoice,
    TResult? Function(TextAnswer value)? text,
  }) {
    return scale1To10?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingAnswer value)? consentRating,
    TResult Function(Scale1To10Answer value)? scale1To10,
    TResult Function(EnumAnswer value)? enumChoice,
    TResult Function(MultiChoiceAnswer value)? multiChoice,
    TResult Function(TextAnswer value)? text,
    required TResult orElse(),
  }) {
    if (scale1To10 != null) {
      return scale1To10(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$Scale1To10AnswerImplToJson(
      this,
    );
  }
}

abstract class Scale1To10Answer extends Answer {
  const factory Scale1To10Answer({required final int value}) =
      _$Scale1To10AnswerImpl;
  const Scale1To10Answer._() : super._();

  factory Scale1To10Answer.fromJson(Map<String, dynamic> json) =
      _$Scale1To10AnswerImpl.fromJson;

  int get value;

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$Scale1To10AnswerImplCopyWith<_$Scale1To10AnswerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$EnumAnswerImplCopyWith<$Res> {
  factory _$$EnumAnswerImplCopyWith(
          _$EnumAnswerImpl value, $Res Function(_$EnumAnswerImpl) then) =
      __$$EnumAnswerImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String option});
}

/// @nodoc
class __$$EnumAnswerImplCopyWithImpl<$Res>
    extends _$AnswerCopyWithImpl<$Res, _$EnumAnswerImpl>
    implements _$$EnumAnswerImplCopyWith<$Res> {
  __$$EnumAnswerImplCopyWithImpl(
      _$EnumAnswerImpl _value, $Res Function(_$EnumAnswerImpl) _then)
      : super(_value, _then);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? option = null,
  }) {
    return _then(_$EnumAnswerImpl(
      option: null == option
          ? _value.option
          : option // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$EnumAnswerImpl extends EnumAnswer {
  const _$EnumAnswerImpl({required this.option, final String? $type})
      : $type = $type ?? 'enum',
        super._();

  factory _$EnumAnswerImpl.fromJson(Map<String, dynamic> json) =>
      _$$EnumAnswerImplFromJson(json);

  @override
  final String option;

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Answer.enumChoice(option: $option)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EnumAnswerImpl &&
            (identical(other.option, option) || other.option == option));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, option);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EnumAnswerImplCopyWith<_$EnumAnswerImpl> get copyWith =>
      __$$EnumAnswerImplCopyWithImpl<_$EnumAnswerImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(ConsentStatus status, int intensity)
        consentRating,
    required TResult Function(int value) scale1To10,
    required TResult Function(String option) enumChoice,
    required TResult Function(List<String> values) multiChoice,
    required TResult Function(String value) text,
  }) {
    return enumChoice(option);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(ConsentStatus status, int intensity)? consentRating,
    TResult? Function(int value)? scale1To10,
    TResult? Function(String option)? enumChoice,
    TResult? Function(List<String> values)? multiChoice,
    TResult? Function(String value)? text,
  }) {
    return enumChoice?.call(option);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(ConsentStatus status, int intensity)? consentRating,
    TResult Function(int value)? scale1To10,
    TResult Function(String option)? enumChoice,
    TResult Function(List<String> values)? multiChoice,
    TResult Function(String value)? text,
    required TResult orElse(),
  }) {
    if (enumChoice != null) {
      return enumChoice(option);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingAnswer value) consentRating,
    required TResult Function(Scale1To10Answer value) scale1To10,
    required TResult Function(EnumAnswer value) enumChoice,
    required TResult Function(MultiChoiceAnswer value) multiChoice,
    required TResult Function(TextAnswer value) text,
  }) {
    return enumChoice(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingAnswer value)? consentRating,
    TResult? Function(Scale1To10Answer value)? scale1To10,
    TResult? Function(EnumAnswer value)? enumChoice,
    TResult? Function(MultiChoiceAnswer value)? multiChoice,
    TResult? Function(TextAnswer value)? text,
  }) {
    return enumChoice?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingAnswer value)? consentRating,
    TResult Function(Scale1To10Answer value)? scale1To10,
    TResult Function(EnumAnswer value)? enumChoice,
    TResult Function(MultiChoiceAnswer value)? multiChoice,
    TResult Function(TextAnswer value)? text,
    required TResult orElse(),
  }) {
    if (enumChoice != null) {
      return enumChoice(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$EnumAnswerImplToJson(
      this,
    );
  }
}

abstract class EnumAnswer extends Answer {
  const factory EnumAnswer({required final String option}) = _$EnumAnswerImpl;
  const EnumAnswer._() : super._();

  factory EnumAnswer.fromJson(Map<String, dynamic> json) =
      _$EnumAnswerImpl.fromJson;

  String get option;

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EnumAnswerImplCopyWith<_$EnumAnswerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$MultiChoiceAnswerImplCopyWith<$Res> {
  factory _$$MultiChoiceAnswerImplCopyWith(_$MultiChoiceAnswerImpl value,
          $Res Function(_$MultiChoiceAnswerImpl) then) =
      __$$MultiChoiceAnswerImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<String> values});
}

/// @nodoc
class __$$MultiChoiceAnswerImplCopyWithImpl<$Res>
    extends _$AnswerCopyWithImpl<$Res, _$MultiChoiceAnswerImpl>
    implements _$$MultiChoiceAnswerImplCopyWith<$Res> {
  __$$MultiChoiceAnswerImplCopyWithImpl(_$MultiChoiceAnswerImpl _value,
      $Res Function(_$MultiChoiceAnswerImpl) _then)
      : super(_value, _then);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? values = null,
  }) {
    return _then(_$MultiChoiceAnswerImpl(
      values: null == values
          ? _value._values
          : values // ignore: cast_nullable_to_non_nullable
              as List<String>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$MultiChoiceAnswerImpl extends MultiChoiceAnswer {
  const _$MultiChoiceAnswerImpl(
      {final List<String> values = const <String>[], final String? $type})
      : _values = values,
        $type = $type ?? 'multi',
        super._();

  factory _$MultiChoiceAnswerImpl.fromJson(Map<String, dynamic> json) =>
      _$$MultiChoiceAnswerImplFromJson(json);

  final List<String> _values;
  @override
  @JsonKey()
  List<String> get values {
    if (_values is EqualUnmodifiableListView) return _values;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_values);
  }

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Answer.multiChoice(values: $values)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$MultiChoiceAnswerImpl &&
            const DeepCollectionEquality().equals(other._values, _values));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_values));

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$MultiChoiceAnswerImplCopyWith<_$MultiChoiceAnswerImpl> get copyWith =>
      __$$MultiChoiceAnswerImplCopyWithImpl<_$MultiChoiceAnswerImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(ConsentStatus status, int intensity)
        consentRating,
    required TResult Function(int value) scale1To10,
    required TResult Function(String option) enumChoice,
    required TResult Function(List<String> values) multiChoice,
    required TResult Function(String value) text,
  }) {
    return multiChoice(values);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(ConsentStatus status, int intensity)? consentRating,
    TResult? Function(int value)? scale1To10,
    TResult? Function(String option)? enumChoice,
    TResult? Function(List<String> values)? multiChoice,
    TResult? Function(String value)? text,
  }) {
    return multiChoice?.call(values);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(ConsentStatus status, int intensity)? consentRating,
    TResult Function(int value)? scale1To10,
    TResult Function(String option)? enumChoice,
    TResult Function(List<String> values)? multiChoice,
    TResult Function(String value)? text,
    required TResult orElse(),
  }) {
    if (multiChoice != null) {
      return multiChoice(values);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingAnswer value) consentRating,
    required TResult Function(Scale1To10Answer value) scale1To10,
    required TResult Function(EnumAnswer value) enumChoice,
    required TResult Function(MultiChoiceAnswer value) multiChoice,
    required TResult Function(TextAnswer value) text,
  }) {
    return multiChoice(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingAnswer value)? consentRating,
    TResult? Function(Scale1To10Answer value)? scale1To10,
    TResult? Function(EnumAnswer value)? enumChoice,
    TResult? Function(MultiChoiceAnswer value)? multiChoice,
    TResult? Function(TextAnswer value)? text,
  }) {
    return multiChoice?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingAnswer value)? consentRating,
    TResult Function(Scale1To10Answer value)? scale1To10,
    TResult Function(EnumAnswer value)? enumChoice,
    TResult Function(MultiChoiceAnswer value)? multiChoice,
    TResult Function(TextAnswer value)? text,
    required TResult orElse(),
  }) {
    if (multiChoice != null) {
      return multiChoice(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$MultiChoiceAnswerImplToJson(
      this,
    );
  }
}

abstract class MultiChoiceAnswer extends Answer {
  const factory MultiChoiceAnswer({final List<String> values}) =
      _$MultiChoiceAnswerImpl;
  const MultiChoiceAnswer._() : super._();

  factory MultiChoiceAnswer.fromJson(Map<String, dynamic> json) =
      _$MultiChoiceAnswerImpl.fromJson;

  List<String> get values;

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$MultiChoiceAnswerImplCopyWith<_$MultiChoiceAnswerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$TextAnswerImplCopyWith<$Res> {
  factory _$$TextAnswerImplCopyWith(
          _$TextAnswerImpl value, $Res Function(_$TextAnswerImpl) then) =
      __$$TextAnswerImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String value});
}

/// @nodoc
class __$$TextAnswerImplCopyWithImpl<$Res>
    extends _$AnswerCopyWithImpl<$Res, _$TextAnswerImpl>
    implements _$$TextAnswerImplCopyWith<$Res> {
  __$$TextAnswerImplCopyWithImpl(
      _$TextAnswerImpl _value, $Res Function(_$TextAnswerImpl) _then)
      : super(_value, _then);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? value = null,
  }) {
    return _then(_$TextAnswerImpl(
      value: null == value
          ? _value.value
          : value // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TextAnswerImpl extends TextAnswer {
  const _$TextAnswerImpl({required this.value, final String? $type})
      : $type = $type ?? 'text',
        super._();

  factory _$TextAnswerImpl.fromJson(Map<String, dynamic> json) =>
      _$$TextAnswerImplFromJson(json);

  @override
  final String value;

  @JsonKey(name: 'schema')
  final String $type;

  @override
  String toString() {
    return 'Answer.text(value: $value)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TextAnswerImpl &&
            (identical(other.value, value) || other.value == value));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, value);

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TextAnswerImplCopyWith<_$TextAnswerImpl> get copyWith =>
      __$$TextAnswerImplCopyWithImpl<_$TextAnswerImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function(ConsentStatus status, int intensity)
        consentRating,
    required TResult Function(int value) scale1To10,
    required TResult Function(String option) enumChoice,
    required TResult Function(List<String> values) multiChoice,
    required TResult Function(String value) text,
  }) {
    return text(value);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function(ConsentStatus status, int intensity)? consentRating,
    TResult? Function(int value)? scale1To10,
    TResult? Function(String option)? enumChoice,
    TResult? Function(List<String> values)? multiChoice,
    TResult? Function(String value)? text,
  }) {
    return text?.call(value);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function(ConsentStatus status, int intensity)? consentRating,
    TResult Function(int value)? scale1To10,
    TResult Function(String option)? enumChoice,
    TResult Function(List<String> values)? multiChoice,
    TResult Function(String value)? text,
    required TResult orElse(),
  }) {
    if (text != null) {
      return text(value);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ConsentRatingAnswer value) consentRating,
    required TResult Function(Scale1To10Answer value) scale1To10,
    required TResult Function(EnumAnswer value) enumChoice,
    required TResult Function(MultiChoiceAnswer value) multiChoice,
    required TResult Function(TextAnswer value) text,
  }) {
    return text(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ConsentRatingAnswer value)? consentRating,
    TResult? Function(Scale1To10Answer value)? scale1To10,
    TResult? Function(EnumAnswer value)? enumChoice,
    TResult? Function(MultiChoiceAnswer value)? multiChoice,
    TResult? Function(TextAnswer value)? text,
  }) {
    return text?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ConsentRatingAnswer value)? consentRating,
    TResult Function(Scale1To10Answer value)? scale1To10,
    TResult Function(EnumAnswer value)? enumChoice,
    TResult Function(MultiChoiceAnswer value)? multiChoice,
    TResult Function(TextAnswer value)? text,
    required TResult orElse(),
  }) {
    if (text != null) {
      return text(this);
    }
    return orElse();
  }

  @override
  Map<String, dynamic> toJson() {
    return _$$TextAnswerImplToJson(
      this,
    );
  }
}

abstract class TextAnswer extends Answer {
  const factory TextAnswer({required final String value}) = _$TextAnswerImpl;
  const TextAnswer._() : super._();

  factory TextAnswer.fromJson(Map<String, dynamic> json) =
      _$TextAnswerImpl.fromJson;

  String get value;

  /// Create a copy of Answer
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TextAnswerImplCopyWith<_$TextAnswerImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
