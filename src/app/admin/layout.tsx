import { AdminSidebar, AdminMobileNav } from "@/components/admin/sidebar";

export const metadata = {
  title: "Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <AdminMobileNav />
        <div className="container mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
