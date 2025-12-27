import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/question_repository.dart';
import '../../domain/entities/template_manifest.dart';

class LandingPage extends StatefulWidget {
  const LandingPage({super.key});

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> {
  final QuestionRepository _repository = QuestionRepository();
  late final Future<List<TemplateManifestItem>> _templatesFuture;

  @override
  void initState() {
    super.initState();
    _templatesFuture = _repository.listTemplates();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: FutureBuilder<List<TemplateManifestItem>>(
            future: _templatesFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }

              if (snapshot.hasError) {
                return Center(
                  child: Text(
                    'Templates konnten nicht geladen werden.',
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                );
              }

              final templates = snapshot.data ?? const [];
              if (templates.isEmpty) {
                return const Center(child: Text('Keine Templates verfuegbar.'));
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'GameX',
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Lokales Pass-and-Play fuer Paare.',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Waehle ein Thema:',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ListView.separated(
                      itemCount: templates.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final item = templates[index];
                        return ListTile(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade300),
                          ),
                          title: Text(item.name),
                          subtitle: item.description == null
                              ? null
                              : Text(item.description!),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () async {
                            try {
                              final template =
                                  await _repository.loadTemplate(item.id);
                              if (!mounted) return;
                              context.go('/questionnaire', extra: template);
                            } catch (_) {
                              if (!mounted) return;
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Template konnte nicht geladen werden.',
                                  ),
                                ),
                              );
                            }
                          },
                        );
                      },
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
