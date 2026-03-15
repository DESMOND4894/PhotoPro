import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh' }} className="bg-slate-50">
      <Sidebar />
      <main style={{ marginLeft: '256px', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        <div style={{ flex: '1 1 0%', padding: '32px' }}>{children}</div>
        <Footer />
      </main>
    </div>
  );
}
