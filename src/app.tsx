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
            <Toaster position="bottom-right" richColors />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/empty" element={<Empty />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </>
    </ThemeProvider>
  );
}

export default App;
