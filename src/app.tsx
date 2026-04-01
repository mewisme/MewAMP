// import './app.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/sonner"
import Home from './pages/home';
import { Layout } from './components/layout';
import Empty from './pages/empty';
import { Titlebar } from './features/titlebar';
import SetupPage from './pages/setup';
import DashboardPage from './pages/dashboard';
import LogsPage from './pages/logs';
import SettingsPage from './pages/settings';
import DiagnosticsPage from './pages/diagnostics';


function App() {
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) {
        return;
      }
      setBootReady(true);
      await invoke("splash_close");
    })().catch((error) => {
      console.error(error);
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/diagnostics" element={<DiagnosticsPage />} />
              <Route path="/empty" element={<Empty />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </>
    </ThemeProvider>
  );
}

export default App;
