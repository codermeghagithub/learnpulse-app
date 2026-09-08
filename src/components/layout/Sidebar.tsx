"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Brain,
  Zap,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  id: string;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "nav-dashboard" },
  { href: "/dashboard/practice", label: "Practice", icon: Zap, id: "nav-practice" },
];

const TEACHER_NAV: NavItem[] = [
  { href: "/teacher", label: "Class Overview", icon: Users, id: "nav-teacher" },
];

interface SidebarProps {
  role: "student" | "teacher";
  fullName: string;
}

export function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm gradient-text">LearnPulse</span>
          <p className="text-[10px] text-muted-foreground -mt-0.5">
            {role === "teacher" ? "Teacher View" : "Student View"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center justify-between rounded-lg px-2 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <button
            id="sidebar-signout-btn"
            onClick={handleSignOut}
            className="ml-2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
