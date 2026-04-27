import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ settings, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar settings={settings} />
      <main style={{ flex: 1, paddingTop: '80px' }}>
        {children}
      </main>
      <Footer settings={settings} />
    </div>
  );
}
