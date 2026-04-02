import { ReactNode } from 'react';
import { Footer } from './footer';
import { AppSidebar } from './app-sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <>
      <main className="fixed top-[35px] bottom-8 h-[calc(100vh-35px-32px)] left-0 right-0 overflow-hidden bg-secondary">
        <div className="flex h-full">
          <AppSidebar />
          <section className="flex-1 overflow-auto p-4">{children}</section>
        </div>
      </main>

      <Footer />
    </>
  );
}