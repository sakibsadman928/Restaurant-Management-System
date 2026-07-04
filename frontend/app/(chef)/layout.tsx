import RoleGuard from "@/components/shared/RoleGuard";
import Sidebar, { type NavItem } from "@/components/shared/Sidebar";

const navItems: NavItem[] = [
  { label: "Kitchen Queue", href: "/chef/kitchen", icon: "ChefHat" },
];

export default function ChefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="chef">
      <div className="flex h-screen">
        <Sidebar navItems={navItems} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
