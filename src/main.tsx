import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface BoundaryState {
  error: Error | null;
}

class RootErrorBoundary extends Component<
  { children: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Flappy NeuroLab render error:', error, info.componentStack);
  }

  private handleResetCacheAndReload = () => {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (
          key &&
          (key.startsWith('flappy-neuro') ||
            key.startsWith('flappy_neurolab') ||
            key.startsWith('neurolab_'))
        ) {
          toRemove.push(key);
        }
      }
      toRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#07080D] text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-xl border border-rose-500/30 bg-[#0C0F17] p-6 space-y-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-rose-400">
            Flappy NeuroLab · Recovery Mode
          </div>
          <h1 className="font-display text-xl font-bold text-white">
            Wystąpił błąd uruchomienia / Startup Error
          </h1>
          <p className="text-xs leading-relaxed text-slate-400">
            {this.state.error.message || 'Unexpected runtime exception.'}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 cursor-pointer"
            >
              Odśwież / Reload
            </button>
            <button
              type="button"
              onClick={this.handleResetCacheAndReload}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 cursor-pointer"
            >
              Wyczyść pamięć lokalną / Reset Local Cache
            </button>
          </div>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
