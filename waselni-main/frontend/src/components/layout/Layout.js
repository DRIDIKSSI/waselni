import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Toaster } from '../ui/sonner';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <Toaster position="top-right" richColors />
    </div>
  );
};
