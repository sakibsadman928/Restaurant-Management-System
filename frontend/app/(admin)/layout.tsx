import RoleGuard from "@/components/shared/RoleGuard";
import Sidebar, { type NavItem } from "@/components/shared/Sidebar";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Menu", href: "/admin/menu", icon: "UtensilsCrossed" },
  { label: "Tables", href: "/admin/tables", icon: "LayoutGrid" },
  { label: "Staff", href: "/admin/staff", icon: "Users" },
  { label: "Reports", href: "/admin/reports", icon: "BarChart3" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="admin">
      <div className="flex h-screen">
        <Sidebar navItems={navItems} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
