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
      <div className="ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8 max-w-6xl">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
