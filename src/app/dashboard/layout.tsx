import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex flex-col min-h-screen overflow-hidden pt-14 md:pt-0 md:ml-64">
        <div className="flex-1 p-4 md:p-8">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
