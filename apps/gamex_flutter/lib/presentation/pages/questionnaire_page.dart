import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/answer.dart';
import '../../domain/entities/question.dart';
import '../../domain/entities/template.dart';
import '../providers/session_notifier.dart';

class QuestionnairePage extends ConsumerStatefulWidget {
  const QuestionnairePage({super.key, required this.template});

  final Template template;

  @override
  ConsumerState<QuestionnairePage> createState() => _QuestionnairePageState();
}

class _QuestionnairePageState extends ConsumerState<QuestionnairePage> {
  late final List<Question> _questions;
  late final Map<String, Question> _questionsById;

  @override
  void initState() {
    super.initState();
    _questions = widget.template.modules
        .expand((module) => module.questions)
        .toList(growable: false);
    _questionsById = {
      for (final question in _questions) question.id: question,
    };

    final session = ref.read(sessionNotifierProvider);
    if (session.phase == SessionPhase.idle && _questions.isNotEmpty) {
      ref.read(sessionNotifierProvider.notifier).startSession(
            templateId: widget.template.id,
            questionOrder: _questions.map((q) => q.id).toList(),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionNotifierProvider);
    final notifier = ref.read(sessionNotifierProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.template.name),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _buildBody(context, session, notifier),
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    SessionFlow session,
    SessionNotifier notifier,
  ) {
    if (_questions.isEmpty) {
      return const Center(child: Text('Keine Fragen verfuegbar.'));
    }

    switch (session.phase) {
      case SessionPhase.idle:
        return Center(
          child: ElevatedButton(
            onPressed: () => notifier.startSession(
              templateId: widget.template.id,
              questionOrder: _questions.map((q) => q.id).toList(),
            ),
            child: const Text('Start'),
          ),
        );
      case SessionPhase.handoverLocked:
        return _handoverScreen(context, notifier);
      case SessionPhase.complete:
        return _completeScreen(context, notifier);
      case SessionPhase.playerAActive:
      case SessionPhase.playerBActive:
        return _questionScreen(context, session, notifier);
    }
  }

  Widget _handoverScreen(BuildContext context, SessionNotifier notifier) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Bitte Geraet an Partner geben.',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: notifier.resumePlayerB,
            child: const Text('Weiter'),
          ),
        ],
      ),
    );
  }

  Widget _completeScreen(BuildContext context, SessionNotifier notifier) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Session abgeschlossen.',
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: notifier.reset,
            child: const Text('Neu starten'),
          ),
        ],
      ),
    );
  }

  Widget _questionScreen(
    BuildContext context,
    SessionFlow session,
    SessionNotifier notifier,
  ) {
    final isPlayerA = session.phase == SessionPhase.playerAActive;
    final total = session.questionOrder.length;
    final index = session.questionIndex.clamp(0, total - 1);
    final questionId = session.questionOrder[index];
    final question = _questionsById[questionId];

    if (question == null) {
      return const Center(child: Text('Frage nicht gefunden.'));
    }

    final answer = isPlayerA
        ? session.answersA[questionId]
        : session.answersB[questionId];
    final hasAnswer = answer != null;
    final isLast = index == total - 1;

    return ListView(
      children: [
        Text(
          isPlayerA ? 'Player A' : 'Player B',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: total == 0 ? 0 : (index + 1) / total,
        ),
        const SizedBox(height: 16),
        Text(
          'Frage ${index + 1} von $total',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 12),
        Text(
          _questionText(question),
          style: Theme.of(context).textTheme.titleLarge,
        ),
        if (_questionHelp(question) != null) ...[
          const SizedBox(height: 8),
          Text(
            _questionHelp(question)!,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
        const SizedBox(height: 20),
        _QuestionInput(
          question: question,
          answer: answer,
          onChanged: (updated) {
            if (isPlayerA) {
              notifier.answerForPlayerA(questionId, updated);
            } else {
              notifier.answerForPlayerB(questionId, updated);
            }
          },
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            OutlinedButton(
              onPressed: index == 0 ? null : notifier.previousQuestion,
              child: const Text('Zurueck'),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: hasAnswer
                  ? () {
                      if (isLast) {
                        if (isPlayerA) {
                          notifier.lockHandover();
                        } else {
                          notifier.completeSession();
                        }
                      } else {
                        notifier.nextQuestion();
                      }
                    }
                  : null,
              child: Text(
                isLast
                    ? (isPlayerA ? 'Uebergabe' : 'Fertig')
                    : 'Weiter',
              ),
            ),
          ],
        ),
      ],
    );
  }

  String _questionText(Question question) {
    return question.map(
      consentRating: (q) => q.text,
      scale1To10: (q) => q.text,
      enumChoice: (q) => q.text,
      multiChoice: (q) => q.text,
      text: (q) => q.text,
    );
  }

  String? _questionHelp(Question question) {
    return question.map(
      consentRating: (q) => q.help,
      scale1To10: (q) => q.help,
      enumChoice: (q) => q.help,
      multiChoice: (q) => q.help,
      text: (q) => q.help,
    );
  }
}

class _QuestionInput extends StatelessWidget {
  const _QuestionInput({
    required this.question,
    required this.answer,
    required this.onChanged,
  });

  final Question question;
  final Answer? answer;
  final ValueChanged<Answer> onChanged;

  @override
  Widget build(BuildContext context) {
    return question.map(
      consentRating: (q) => _ConsentRatingInput(
        question: q,
        answer: answer is ConsentRatingAnswer ? answer as ConsentRatingAnswer : null,
        onChanged: onChanged,
      ),
      scale1To10: (q) => _ScaleInput(
        question: q,
        answer: answer is Scale1To10Answer ? answer as Scale1To10Answer : null,
        onChanged: onChanged,
      ),
      enumChoice: (q) => _EnumInput(
        question: q,
        answer: answer is EnumAnswer ? answer as EnumAnswer : null,
        onChanged: onChanged,
      ),
      multiChoice: (q) => _MultiInput(
        question: q,
        answer: answer is MultiChoiceAnswer ? answer as MultiChoiceAnswer : null,
        onChanged: onChanged,
      ),
      text: (q) => _TextInput(
        question: q,
        answer: answer is TextAnswer ? answer as TextAnswer : null,
        onChanged: onChanged,
      ),
    );
  }
}

class _ConsentRatingInput extends StatelessWidget {
  const _ConsentRatingInput({
    required this.question,
    required this.answer,
    required this.onChanged,
  });

  final ConsentRatingQuestion question;
  final ConsentRatingAnswer? answer;
  final ValueChanged<Answer> onChanged;

  @override
  Widget build(BuildContext context) {
    final status = answer?.status;
    final intensity = answer?.intensity ?? 3;
    final sliderValue = intensity.clamp(1, 5).toDouble();
    final canAdjust = status != null && !_isHardNo(status);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ConsentStatus.values.map((value) {
            return ChoiceChip(
              label: Text(_statusLabel(value)),
              selected: status == value,
              onSelected: (_) {
                final currentIntensity = intensity == 0 ? 3 : intensity;
                onChanged(
                  Answer.consentRating(
                    status: value,
                    intensity: currentIntensity,
                  ),
                );
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Text('Komfort: ${sliderValue.toInt()}/5'),
        Slider(
          value: sliderValue,
          min: 1,
          max: 5,
          divisions: 4,
          label: sliderValue.toInt().toString(),
          onChanged: canAdjust
              ? (value) {
                  onChanged(
                    Answer.consentRating(
                      status: status ?? ConsentStatus.maybe,
                      intensity: value.round(),
                    ),
                  );
                }
              : null,
        ),
      ],
    );
  }

  bool _isHardNo(ConsentStatus status) {
    return status == ConsentStatus.no || status == ConsentStatus.hardLimit;
  }

  String _statusLabel(ConsentStatus status) {
    switch (status) {
      case ConsentStatus.yes:
        return 'Yes';
      case ConsentStatus.maybe:
        return 'Maybe';
      case ConsentStatus.no:
        return 'No';
      case ConsentStatus.hardLimit:
        return 'Hard Limit';
    }
  }
}

class _ScaleInput extends StatelessWidget {
  const _ScaleInput({
    required this.question,
    required this.answer,
    required this.onChanged,
  });

  final Scale1To10Question question;
  final Scale1To10Answer? answer;
  final ValueChanged<Answer> onChanged;

  @override
  Widget build(BuildContext context) {
    final value = (answer?.value ?? 5).clamp(1, 10).toDouble();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Wert: ${value.toInt()}'),
        Slider(
          value: value,
          min: 1,
          max: 10,
          divisions: 9,
          label: value.toInt().toString(),
          onChanged: (next) {
            onChanged(Answer.scale1To10(value: next.round()));
          },
        ),
      ],
    );
  }
}

class _EnumInput extends StatelessWidget {
  const _EnumInput({
    required this.question,
    required this.answer,
    required this.onChanged,
  });

  final EnumQuestion question;
  final EnumAnswer? answer;
  final ValueChanged<Answer> onChanged;

  @override
  Widget build(BuildContext context) {
    if (question.options.isEmpty) {
      return const Text('Keine Optionen verfuegbar.');
    }

    final selected = answer?.value;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: question.options.map((option) {
        return ChoiceChip(
          label: Text(option),
          selected: selected == option,
          onSelected: (_) => onChanged(Answer.enumChoice(value: option)),
        );
      }).toList(),
    );
  }
}

class _MultiInput extends StatelessWidget {
  const _MultiInput({
    required this.question,
    required this.answer,
    required this.onChanged,
  });

  final MultiChoiceQuestion question;
  final MultiChoiceAnswer? answer;
  final ValueChanged<Answer> onChanged;

  @override
  Widget build(BuildContext context) {
    if (question.options.isEmpty) {
      return const Text('Keine Optionen verfuegbar.');
    }

    final selected = answer?.values ?? const <String>[];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: question.options.map((option) {
        final isSelected = selected.contains(option);
        return FilterChip(
          label: Text(option),
          selected: isSelected,
          onSelected: (next) {
            final updated = List<String>.from(selected);
            if (next) {
              updated.add(option);
            } else {
              updated.remove(option);
            }
            onChanged(Answer.multiChoice(values: updated));
          },
        );
      }).toList(),
    );
  }
}

class _TextInput extends StatefulWidget {
  const _TextInput({
    required this.question,
    required this.answer,
    required this.onChanged,
  });

  final TextQuestion question;
  final TextAnswer? answer;
  final ValueChanged<Answer> onChanged;

  @override
  State<_TextInput> createState() => _TextInputState();
}

class _TextInputState extends State<_TextInput> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.answer?.text ?? '');
  }

  @override
  void didUpdateWidget(covariant _TextInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    final nextValue = widget.answer?.text ?? '';
    if (_controller.text != nextValue) {
      _controller.text = nextValue;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      maxLines: 4,
      decoration: InputDecoration(
        hintText: widget.question.placeholder ?? 'Antwort eingeben',
        border: const OutlineInputBorder(),
      ),
      onChanged: (value) => widget.onChanged(Answer.text(text: value)),
    );
  }
}
