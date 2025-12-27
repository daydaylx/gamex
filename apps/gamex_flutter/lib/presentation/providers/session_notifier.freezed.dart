// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'session_notifier.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$SessionFlow {
  SessionPhase get phase => throw _privateConstructorUsedError;
  String? get templateId => throw _privateConstructorUsedError;
  int get questionIndex => throw _privateConstructorUsedError;
  List<String> get questionOrder => throw _privateConstructorUsedError;
  Map<String, Answer> get answersA => throw _privateConstructorUsedError;
  Map<String, Answer> get answersB => throw _privateConstructorUsedError;

  /// Create a copy of SessionFlow
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $SessionFlowCopyWith<SessionFlow> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $SessionFlowCopyWith<$Res> {
  factory $SessionFlowCopyWith(
          SessionFlow value, $Res Function(SessionFlow) then) =
      _$SessionFlowCopyWithImpl<$Res, SessionFlow>;
  @useResult
  $Res call(
      {SessionPhase phase,
      String? templateId,
      int questionIndex,
      List<String> questionOrder,
      Map<String, Answer> answersA,
      Map<String, Answer> answersB});
}

/// @nodoc
class _$SessionFlowCopyWithImpl<$Res, $Val extends SessionFlow>
    implements $SessionFlowCopyWith<$Res> {
  _$SessionFlowCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of SessionFlow
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? phase = null,
    Object? templateId = freezed,
    Object? questionIndex = null,
    Object? questionOrder = null,
    Object? answersA = null,
    Object? answersB = null,
  }) {
    return _then(_value.copyWith(
      phase: null == phase
          ? _value.phase
          : phase // ignore: cast_nullable_to_non_nullable
              as SessionPhase,
      templateId: freezed == templateId
          ? _value.templateId
          : templateId // ignore: cast_nullable_to_non_nullable
              as String?,
      questionIndex: null == questionIndex
          ? _value.questionIndex
          : questionIndex // ignore: cast_nullable_to_non_nullable
              as int,
      questionOrder: null == questionOrder
          ? _value.questionOrder
          : questionOrder // ignore: cast_nullable_to_non_nullable
              as List<String>,
      answersA: null == answersA
          ? _value.answersA
          : answersA // ignore: cast_nullable_to_non_nullable
              as Map<String, Answer>,
      answersB: null == answersB
          ? _value.answersB
          : answersB // ignore: cast_nullable_to_non_nullable
              as Map<String, Answer>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$SessionFlowImplCopyWith<$Res>
    implements $SessionFlowCopyWith<$Res> {
  factory _$$SessionFlowImplCopyWith(
          _$SessionFlowImpl value, $Res Function(_$SessionFlowImpl) then) =
      __$$SessionFlowImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {SessionPhase phase,
      String? templateId,
      int questionIndex,
      List<String> questionOrder,
      Map<String, Answer> answersA,
      Map<String, Answer> answersB});
}

/// @nodoc
class __$$SessionFlowImplCopyWithImpl<$Res>
    extends _$SessionFlowCopyWithImpl<$Res, _$SessionFlowImpl>
    implements _$$SessionFlowImplCopyWith<$Res> {
  __$$SessionFlowImplCopyWithImpl(
      _$SessionFlowImpl _value, $Res Function(_$SessionFlowImpl) _then)
      : super(_value, _then);

  /// Create a copy of SessionFlow
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? phase = null,
    Object? templateId = freezed,
    Object? questionIndex = null,
    Object? questionOrder = null,
    Object? answersA = null,
    Object? answersB = null,
  }) {
    return _then(_$SessionFlowImpl(
      phase: null == phase
          ? _value.phase
          : phase // ignore: cast_nullable_to_non_nullable
              as SessionPhase,
      templateId: freezed == templateId
          ? _value.templateId
          : templateId // ignore: cast_nullable_to_non_nullable
              as String?,
      questionIndex: null == questionIndex
          ? _value.questionIndex
          : questionIndex // ignore: cast_nullable_to_non_nullable
              as int,
      questionOrder: null == questionOrder
          ? _value._questionOrder
          : questionOrder // ignore: cast_nullable_to_non_nullable
              as List<String>,
      answersA: null == answersA
          ? _value._answersA
          : answersA // ignore: cast_nullable_to_non_nullable
              as Map<String, Answer>,
      answersB: null == answersB
          ? _value._answersB
          : answersB // ignore: cast_nullable_to_non_nullable
              as Map<String, Answer>,
    ));
  }
}

/// @nodoc

class _$SessionFlowImpl implements _SessionFlow {
  const _$SessionFlowImpl(
      {this.phase = SessionPhase.idle,
      this.templateId,
      this.questionIndex = 0,
      final List<String> questionOrder = const <String>[],
      final Map<String, Answer> answersA = const <String, Answer>{},
      final Map<String, Answer> answersB = const <String, Answer>{}})
      : _questionOrder = questionOrder,
        _answersA = answersA,
        _answersB = answersB;

  @override
  @JsonKey()
  final SessionPhase phase;
  @override
  final String? templateId;
  @override
  @JsonKey()
  final int questionIndex;
  final List<String> _questionOrder;
  @override
  @JsonKey()
  List<String> get questionOrder {
    if (_questionOrder is EqualUnmodifiableListView) return _questionOrder;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_questionOrder);
  }

  final Map<String, Answer> _answersA;
  @override
  @JsonKey()
  Map<String, Answer> get answersA {
    if (_answersA is EqualUnmodifiableMapView) return _answersA;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_answersA);
  }

  final Map<String, Answer> _answersB;
  @override
  @JsonKey()
  Map<String, Answer> get answersB {
    if (_answersB is EqualUnmodifiableMapView) return _answersB;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_answersB);
  }

  @override
  String toString() {
    return 'SessionFlow(phase: $phase, templateId: $templateId, questionIndex: $questionIndex, questionOrder: $questionOrder, answersA: $answersA, answersB: $answersB)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$SessionFlowImpl &&
            (identical(other.phase, phase) || other.phase == phase) &&
            (identical(other.templateId, templateId) ||
                other.templateId == templateId) &&
            (identical(other.questionIndex, questionIndex) ||
                other.questionIndex == questionIndex) &&
            const DeepCollectionEquality()
                .equals(other._questionOrder, _questionOrder) &&
            const DeepCollectionEquality().equals(other._answersA, _answersA) &&
            const DeepCollectionEquality().equals(other._answersB, _answersB));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      phase,
      templateId,
      questionIndex,
      const DeepCollectionEquality().hash(_questionOrder),
      const DeepCollectionEquality().hash(_answersA),
      const DeepCollectionEquality().hash(_answersB));

  /// Create a copy of SessionFlow
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$SessionFlowImplCopyWith<_$SessionFlowImpl> get copyWith =>
      __$$SessionFlowImplCopyWithImpl<_$SessionFlowImpl>(this, _$identity);
}

abstract class _SessionFlow implements SessionFlow {
  const factory _SessionFlow(
      {final SessionPhase phase,
      final String? templateId,
      final int questionIndex,
      final List<String> questionOrder,
      final Map<String, Answer> answersA,
      final Map<String, Answer> answersB}) = _$SessionFlowImpl;

  @override
  SessionPhase get phase;
  @override
  String? get templateId;
  @override
  int get questionIndex;
  @override
  List<String> get questionOrder;
  @override
  Map<String, Answer> get answersA;
  @override
  Map<String, Answer> get answersB;

  /// Create a copy of SessionFlow
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$SessionFlowImplCopyWith<_$SessionFlowImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
