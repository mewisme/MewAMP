// import './app.css';

import { invoke } from '@tauri-apps/api/core';
import { ThemeProvider } from 'next-themes';
import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { Layout } from '@/components/layout';
import { Toaster } from '@/components/ui/sonner';
import { Spinner } from '@/components/ui/spinner';
import { Titlebar } from '@/features/titlebar';

const Home = lazy(() => import('./pages/home'));
const Empty = lazy(() => import('./pages/empty'));
const SetupPage = lazy(() => import('./pages/setup'));
const DashboardPage = lazy(() => import('./pages/dashboard'));
const LogsPage = lazy(() => import('./pages/logs'));
const SettingsPage = lazy(() => import('./pages/settings'));
const DiagnosticsPage = lazy(() => import('./pages/diagnostics'));


function App() {
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    setBootReady(true);
  }, []);

  useEffect(() => {
    if (!bootReady) {
      return;
    }

    let cancelled = false;

    const closeSplashAfterLoad = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      if (cancelled) {
        return;
      }

      await invoke("splash_close");
    };

    const runCloseSplash = () => {
      closeSplashAfterLoad().catch((error) => {
        console.error(error);
      });
    };

    if (document.readyState === "complete") {
      runCloseSplash();
    } else {
      window.addEventListener("load", runCloseSplash, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", runCloseSplash);
    };
  }, [bootReady]);

  if (!bootReady) {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <>
        <Titlebar />
        <BrowserRouter>
          <Layout>
            <Toaster position="bottom-center" richColors offset={50} />
            <Suspense
              fallback={
                <div className="flex h-full min-h-48 items-center justify-center">
                  <Spinner className="size-8 text-muted-foreground" />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/setup" element={<SetupPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/diagnostics" element={<DiagnosticsPage />} />
                <Route path="/empty" element={<Empty />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </>
    </ThemeProvider>
  );
}

export default App;
