import RoleGuard from "@/components/shared/RoleGuard";
import Sidebar, { type NavItem } from "@/components/shared/Sidebar";

const navItems: NavItem[] = [
  { label: "My Tables", href: "/waiter/tables", icon: "LayoutGrid" },
  { label: "Notifications", href: "/waiter/notifications", icon: "Bell" },
];

export default function WaiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="waiter">
      <div className="flex h-screen">
        <Sidebar navItems={navItems} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
