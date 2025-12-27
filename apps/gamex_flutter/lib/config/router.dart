import 'package:go_router/go_router.dart';
import '../presentation/pages/landing_page.dart';
import '../presentation/pages/questionnaire_page.dart';
import '../domain/entities/template.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const LandingPage(),
    ),
    GoRoute(
      path: '/questionnaire',
      builder: (context, state) {
        final template = state.extra as Template?;
        if (template == null) {
          return const LandingPage();
        }
        return QuestionnairePage(template: template);
      },
    ),
  ],
);
