"use client";

import SessionProvider from "@/components/SessionProvider";
import { AdminGuard } from "@/app/components/admin-dashboard/AdminGuard";
import { CollapsibleSidebar } from "@/app/components/admin-dashboard/CollapsibleSidebar";
import { Toaster } from "@/app/components/ui/sonner";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminGuard>
        <div className="flex h-screen bg-background">
          <CollapsibleSidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
        <Toaster />
      </AdminGuard>
    </SessionProvider>
  );
}
