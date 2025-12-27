import 'answer.dart';
import 'question.dart';

enum MatchBucket {
  doableNow,
  talkFirst,
  explore,
  mismatch,
}

class ComparisonItem {
  const ComparisonItem({
    required this.questionId,
    required this.bucket,
    required this.riskLevel,
    required this.answerA,
    required this.answerB,
  });

  final String questionId;
  final MatchBucket bucket;
  final RiskLevel riskLevel;
  final Answer? answerA;
  final Answer? answerB;
}

class ComparisonResult {
  const ComparisonResult({required this.items});

  final List<ComparisonItem> items;

  Map<MatchBucket, int> get counts {
    final counts = <MatchBucket, int>{
      MatchBucket.doableNow: 0,
      MatchBucket.talkFirst: 0,
      MatchBucket.explore: 0,
      MatchBucket.mismatch: 0,
    };
    for (final item in items) {
      counts[item.bucket] = (counts[item.bucket] ?? 0) + 1;
    }
    return counts;
  }

  List<ComparisonItem> itemsFor(MatchBucket bucket) {
    return items.where((item) => item.bucket == bucket).toList();
  }
}
