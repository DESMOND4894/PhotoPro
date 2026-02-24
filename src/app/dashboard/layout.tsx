import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <div className="flex-1 p-8">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
