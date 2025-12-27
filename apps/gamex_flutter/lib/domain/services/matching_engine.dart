import '../entities/answer.dart';
import '../entities/comparison_result.dart';
import '../entities/question.dart';

class MatchingEngine {
  MatchingEngine({
    Map<String, RiskLevel>? riskByQuestionId,
    Set<RiskLevel>? doableRiskLevels,
    this.comfortThreshold = 3,
    this.scaleTolerance = 1,
  })  : _riskByQuestionId = riskByQuestionId ?? const {},
        _doableRiskLevels = doableRiskLevels ?? const {RiskLevel.low};

  final Map<String, RiskLevel> _riskByQuestionId;
  final Set<RiskLevel> _doableRiskLevels;
  final int comfortThreshold;
  final int scaleTolerance;

  ComparisonResult compare(
    Map<String, Answer> answersA,
    Map<String, Answer> answersB,
  ) {
    final ids = <String>{...answersA.keys, ...answersB.keys};
    final items = <ComparisonItem>[];

    for (final id in ids) {
      final answerA = answersA[id];
      final answerB = answersB[id];
      final riskLevel = _riskByQuestionId[id] ?? RiskLevel.low;
      final bucket = _compareSingle(answerA, answerB, riskLevel);

      items.add(
        ComparisonItem(
          questionId: id,
          bucket: bucket,
          riskLevel: riskLevel,
          answerA: answerA,
          answerB: answerB,
        ),
      );
    }

    return ComparisonResult(items: items);
  }

  MatchBucket _compareSingle(
    Answer? answerA,
    Answer? answerB,
    RiskLevel riskLevel,
  ) {
    if (answerA == null || answerB == null) {
      return MatchBucket.mismatch;
    }

    if (answerA is ConsentRatingAnswer && answerB is ConsentRatingAnswer) {
      return _compareConsent(answerA, answerB, riskLevel);
    }

    if (answerA is Scale1To10Answer && answerB is Scale1To10Answer) {
      return _compareScale(answerA.value, answerB.value, riskLevel);
    }

    if (answerA is EnumAnswer && answerB is EnumAnswer) {
      return _compareEnum(answerA.value, answerB.value, riskLevel);
    }

    if (answerA is MultiChoiceAnswer && answerB is MultiChoiceAnswer) {
      return _compareMulti(answerA.values, answerB.values, riskLevel);
    }

    return MatchBucket.explore;
  }

  MatchBucket _compareConsent(
    ConsentRatingAnswer answerA,
    ConsentRatingAnswer answerB,
    RiskLevel riskLevel,
  ) {
    final statusA = answerA.status;
    final statusB = answerB.status;

    if (_isHardNo(statusA) || _isHardNo(statusB)) {
      return MatchBucket.mismatch;
    }

    final comfortHigh =
        answerA.intensity >= comfortThreshold &&
        answerB.intensity >= comfortThreshold;
    final comfortLow =
        answerA.intensity < comfortThreshold ||
        answerB.intensity < comfortThreshold;
    final riskAllowsDoable = _doableRiskLevels.contains(riskLevel);
    final riskBlocks = !_doableRiskLevels.contains(riskLevel);

    if (statusA == ConsentStatus.yes && statusB == ConsentStatus.yes) {
      if (comfortHigh && riskAllowsDoable) {
        return MatchBucket.doableNow;
      }
      return MatchBucket.talkFirst;
    }

    if (statusA == ConsentStatus.maybe && statusB == ConsentStatus.maybe) {
      return MatchBucket.talkFirst;
    }

    if (_isYesMaybePair(statusA, statusB)) {
      if (riskBlocks || comfortLow) {
        return MatchBucket.talkFirst;
      }
      return MatchBucket.explore;
    }

    return MatchBucket.explore;
  }

  MatchBucket _compareScale(int valueA, int valueB, RiskLevel riskLevel) {
    final delta = (valueA - valueB).abs();
    final isClose = delta <= scaleTolerance;
    if (isClose && _doableRiskLevels.contains(riskLevel)) {
      return MatchBucket.doableNow;
    }
    if (isClose) {
      return MatchBucket.talkFirst;
    }
    return MatchBucket.explore;
  }

  MatchBucket _compareEnum(String optionA, String optionB, RiskLevel riskLevel) {
    if (optionA != optionB) {
      return MatchBucket.explore;
    }
    if (_doableRiskLevels.contains(riskLevel)) {
      return MatchBucket.doableNow;
    }
    return MatchBucket.talkFirst;
  }

  MatchBucket _compareMulti(
    List<String> valuesA,
    List<String> valuesB,
    RiskLevel riskLevel,
  ) {
    final intersection = valuesA.toSet().intersection(valuesB.toSet());
    if (intersection.isEmpty) {
      return MatchBucket.explore;
    }
    if (_doableRiskLevels.contains(riskLevel)) {
      return MatchBucket.doableNow;
    }
    return MatchBucket.talkFirst;
  }

  bool _isHardNo(ConsentStatus status) {
    return status == ConsentStatus.no || status == ConsentStatus.hardLimit;
  }

  bool _isYesMaybePair(ConsentStatus a, ConsentStatus b) {
    return (a == ConsentStatus.yes && b == ConsentStatus.maybe) ||
        (a == ConsentStatus.maybe && b == ConsentStatus.yes);
  }
}
