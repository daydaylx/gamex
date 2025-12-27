// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'template_manifest.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

TemplateManifest _$TemplateManifestFromJson(Map<String, dynamic> json) {
  return _TemplateManifest.fromJson(json);
}

/// @nodoc
mixin _$TemplateManifest {
  List<TemplateManifestItem> get templates =>
      throw _privateConstructorUsedError;

  /// Serializes this TemplateManifest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TemplateManifest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TemplateManifestCopyWith<TemplateManifest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TemplateManifestCopyWith<$Res> {
  factory $TemplateManifestCopyWith(
          TemplateManifest value, $Res Function(TemplateManifest) then) =
      _$TemplateManifestCopyWithImpl<$Res, TemplateManifest>;
  @useResult
  $Res call({List<TemplateManifestItem> templates});
}

/// @nodoc
class _$TemplateManifestCopyWithImpl<$Res, $Val extends TemplateManifest>
    implements $TemplateManifestCopyWith<$Res> {
  _$TemplateManifestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TemplateManifest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? templates = null,
  }) {
    return _then(_value.copyWith(
      templates: null == templates
          ? _value.templates
          : templates // ignore: cast_nullable_to_non_nullable
              as List<TemplateManifestItem>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$TemplateManifestImplCopyWith<$Res>
    implements $TemplateManifestCopyWith<$Res> {
  factory _$$TemplateManifestImplCopyWith(_$TemplateManifestImpl value,
          $Res Function(_$TemplateManifestImpl) then) =
      __$$TemplateManifestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({List<TemplateManifestItem> templates});
}

/// @nodoc
class __$$TemplateManifestImplCopyWithImpl<$Res>
    extends _$TemplateManifestCopyWithImpl<$Res, _$TemplateManifestImpl>
    implements _$$TemplateManifestImplCopyWith<$Res> {
  __$$TemplateManifestImplCopyWithImpl(_$TemplateManifestImpl _value,
      $Res Function(_$TemplateManifestImpl) _then)
      : super(_value, _then);

  /// Create a copy of TemplateManifest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? templates = null,
  }) {
    return _then(_$TemplateManifestImpl(
      templates: null == templates
          ? _value._templates
          : templates // ignore: cast_nullable_to_non_nullable
              as List<TemplateManifestItem>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TemplateManifestImpl implements _TemplateManifest {
  const _$TemplateManifestImpl(
      {final List<TemplateManifestItem> templates =
          const <TemplateManifestItem>[]})
      : _templates = templates;

  factory _$TemplateManifestImpl.fromJson(Map<String, dynamic> json) =>
      _$$TemplateManifestImplFromJson(json);

  final List<TemplateManifestItem> _templates;
  @override
  @JsonKey()
  List<TemplateManifestItem> get templates {
    if (_templates is EqualUnmodifiableListView) return _templates;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_templates);
  }

  @override
  String toString() {
    return 'TemplateManifest(templates: $templates)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TemplateManifestImpl &&
            const DeepCollectionEquality()
                .equals(other._templates, _templates));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, const DeepCollectionEquality().hash(_templates));

  /// Create a copy of TemplateManifest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TemplateManifestImplCopyWith<_$TemplateManifestImpl> get copyWith =>
      __$$TemplateManifestImplCopyWithImpl<_$TemplateManifestImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TemplateManifestImplToJson(
      this,
    );
  }
}

abstract class _TemplateManifest implements TemplateManifest {
  const factory _TemplateManifest(
      {final List<TemplateManifestItem> templates}) = _$TemplateManifestImpl;

  factory _TemplateManifest.fromJson(Map<String, dynamic> json) =
      _$TemplateManifestImpl.fromJson;

  @override
  List<TemplateManifestItem> get templates;

  /// Create a copy of TemplateManifest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TemplateManifestImplCopyWith<_$TemplateManifestImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

TemplateManifestItem _$TemplateManifestItemFromJson(Map<String, dynamic> json) {
  return _TemplateManifestItem.fromJson(json);
}

/// @nodoc
mixin _$TemplateManifestItem {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  int? get version => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  @JsonKey(name: 'asset')
  String get assetPath => throw _privateConstructorUsedError;

  /// Serializes this TemplateManifestItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of TemplateManifestItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TemplateManifestItemCopyWith<TemplateManifestItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TemplateManifestItemCopyWith<$Res> {
  factory $TemplateManifestItemCopyWith(TemplateManifestItem value,
          $Res Function(TemplateManifestItem) then) =
      _$TemplateManifestItemCopyWithImpl<$Res, TemplateManifestItem>;
  @useResult
  $Res call(
      {String id,
      String name,
      int? version,
      String? description,
      @JsonKey(name: 'asset') String assetPath});
}

/// @nodoc
class _$TemplateManifestItemCopyWithImpl<$Res,
        $Val extends TemplateManifestItem>
    implements $TemplateManifestItemCopyWith<$Res> {
  _$TemplateManifestItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of TemplateManifestItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? version = freezed,
    Object? description = freezed,
    Object? assetPath = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      version: freezed == version
          ? _value.version
          : version // ignore: cast_nullable_to_non_nullable
              as int?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      assetPath: null == assetPath
          ? _value.assetPath
          : assetPath // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$TemplateManifestItemImplCopyWith<$Res>
    implements $TemplateManifestItemCopyWith<$Res> {
  factory _$$TemplateManifestItemImplCopyWith(_$TemplateManifestItemImpl value,
          $Res Function(_$TemplateManifestItemImpl) then) =
      __$$TemplateManifestItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String name,
      int? version,
      String? description,
      @JsonKey(name: 'asset') String assetPath});
}

/// @nodoc
class __$$TemplateManifestItemImplCopyWithImpl<$Res>
    extends _$TemplateManifestItemCopyWithImpl<$Res, _$TemplateManifestItemImpl>
    implements _$$TemplateManifestItemImplCopyWith<$Res> {
  __$$TemplateManifestItemImplCopyWithImpl(_$TemplateManifestItemImpl _value,
      $Res Function(_$TemplateManifestItemImpl) _then)
      : super(_value, _then);

  /// Create a copy of TemplateManifestItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? version = freezed,
    Object? description = freezed,
    Object? assetPath = null,
  }) {
    return _then(_$TemplateManifestItemImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      version: freezed == version
          ? _value.version
          : version // ignore: cast_nullable_to_non_nullable
              as int?,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      assetPath: null == assetPath
          ? _value.assetPath
          : assetPath // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TemplateManifestItemImpl implements _TemplateManifestItem {
  const _$TemplateManifestItemImpl(
      {required this.id,
      required this.name,
      this.version,
      this.description,
      @JsonKey(name: 'asset') required this.assetPath});

  factory _$TemplateManifestItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$TemplateManifestItemImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final int? version;
  @override
  final String? description;
  @override
  @JsonKey(name: 'asset')
  final String assetPath;

  @override
  String toString() {
    return 'TemplateManifestItem(id: $id, name: $name, version: $version, description: $description, assetPath: $assetPath)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TemplateManifestItemImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.version, version) || other.version == version) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.assetPath, assetPath) ||
                other.assetPath == assetPath));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode =>
      Object.hash(runtimeType, id, name, version, description, assetPath);

  /// Create a copy of TemplateManifestItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TemplateManifestItemImplCopyWith<_$TemplateManifestItemImpl>
      get copyWith =>
          __$$TemplateManifestItemImplCopyWithImpl<_$TemplateManifestItemImpl>(
              this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TemplateManifestItemImplToJson(
      this,
    );
  }
}

abstract class _TemplateManifestItem implements TemplateManifestItem {
  const factory _TemplateManifestItem(
          {required final String id,
          required final String name,
          final int? version,
          final String? description,
          @JsonKey(name: 'asset') required final String assetPath}) =
      _$TemplateManifestItemImpl;

  factory _TemplateManifestItem.fromJson(Map<String, dynamic> json) =
      _$TemplateManifestItemImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  int? get version;
  @override
  String? get description;
  @override
  @JsonKey(name: 'asset')
  String get assetPath;

  /// Create a copy of TemplateManifestItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TemplateManifestItemImplCopyWith<_$TemplateManifestItemImpl>
      get copyWith => throw _privateConstructorUsedError;
}
