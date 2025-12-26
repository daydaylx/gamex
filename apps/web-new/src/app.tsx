import { Router, Route } from 'wouter-preact';
import { MainLayout } from './components/layout/MainLayout';
import { HomeView } from './views/HomeView';
import { SessionView } from './views/SessionView';

export function App() {
  return (
    <Router>
      <MainLayout>
        <Route path="/" component={HomeView} />
        <Route path="/sessions/:id" component={SessionView} />
        <Route path="/sessions" component={HomeView} />
      </MainLayout>
    </Router>
  );
}
