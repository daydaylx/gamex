import 'package:freezed_annotation/freezed_annotation.dart';

import 'question.dart';

part 'template.freezed.dart';
part 'template.g.dart';

@freezed
class Template with _$Template {
  const factory Template({
    required String id,
    required String name,
    String? description,
    int? version,
    @Default(<Module>[]) List<Module> modules,
  }) = _Template;

  factory Template.fromJson(Map<String, dynamic> json) =>
      _$TemplateFromJson(json);
}

@freezed
class Module with _$Module {
  const factory Module({
    required String id,
    required String name,
    String? description,
    @Default(<Question>[]) List<Question> questions,
  }) = _Module;

  factory Module.fromJson(Map<String, dynamic> json) =>
      _$ModuleFromJson(json);
}
