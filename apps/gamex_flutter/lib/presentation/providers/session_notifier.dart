import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../domain/entities/answer.dart';

part 'session_notifier.freezed.dart';
part 'session_notifier.g.dart';

enum SessionPhase {
  idle,
  playerAActive,
  handoverLocked,
  playerBActive,
  complete,
}

@freezed
class SessionFlow with _$SessionFlow {
  const factory SessionFlow({
    @Default(SessionPhase.idle) SessionPhase phase,
    String? templateId,
    @Default(0) int questionIndex,
    @Default(<String>[]) List<String> questionOrder,
    @Default(<String, Answer>{}) Map<String, Answer> answersA,
    @Default(<String, Answer>{}) Map<String, Answer> answersB,
  }) = _SessionFlow;
}

@riverpod
class SessionNotifier extends _$SessionNotifier {
  @override
  SessionFlow build() => const SessionFlow();

  void startSession({
    required String templateId,
    required List<String> questionOrder,
  }) {
    state = SessionFlow(
      phase: SessionPhase.playerAActive,
      templateId: templateId,
      questionOrder: List<String>.from(questionOrder),
      questionIndex: 0,
      answersA: const {},
      answersB: const {},
    );
  }

  void lockHandover() {
    if (state.phase != SessionPhase.playerAActive) {
      return;
    }
    state = state.copyWith(phase: SessionPhase.handoverLocked);
  }

  void resumePlayerB() {
    if (state.phase != SessionPhase.handoverLocked) {
      return;
    }
    state = state.copyWith(
      phase: SessionPhase.playerBActive,
      questionIndex: 0,
    );
  }

  void completeSession() {
    if (state.phase != SessionPhase.playerBActive) {
      return;
    }
    state = state.copyWith(phase: SessionPhase.complete);
  }

  void reset() {
    state = const SessionFlow();
  }

  void answerForPlayerA(String questionId, Answer answer) {
    if (state.phase != SessionPhase.playerAActive) {
      return;
    }
    final updated = Map<String, Answer>.from(state.answersA)
      ..[questionId] = answer;
    state = state.copyWith(answersA: updated);
  }

  void answerForPlayerB(String questionId, Answer answer) {
    if (state.phase != SessionPhase.playerBActive) {
      return;
    }
    final updated = Map<String, Answer>.from(state.answersB)
      ..[questionId] = answer;
    state = state.copyWith(answersB: updated);
  }

  void nextQuestion() {
    if (state.questionOrder.isEmpty) {
      return;
    }
    final nextIndex = state.questionIndex + 1;
    if (nextIndex >= state.questionOrder.length) {
      return;
    }
    state = state.copyWith(questionIndex: nextIndex);
  }

  void previousQuestion() {
    if (state.questionOrder.isEmpty) {
      return;
    }
    final prevIndex = state.questionIndex - 1;
    if (prevIndex < 0) {
      return;
    }
    state = state.copyWith(questionIndex: prevIndex);
  }
}
