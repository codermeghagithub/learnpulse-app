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
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar/95 backdrop-blur-xl relative z-20 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/80">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand glow-brand shadow-sm">
          <Brain className="h-5 w-5 text-white animate-float" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base gradient-text tracking-tight">LearnPulse</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {role === "teacher" ? "Teacher View" : "Student View"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3.5 py-5 space-y-1.5" aria-label="Main navigation">
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
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/25 shadow-xs font-semibold"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-0.5"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className="border-t border-border/80 p-3.5">
        <div className="flex items-center justify-between rounded-xl p-2.5 glass-card border border-border/60 hover:border-primary/30 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase border border-primary/20 shrink-0">
              {fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate leading-tight">{fullName}</p>
              <p className="text-[10px] text-muted-foreground capitalize leading-tight mt-0.5">{role}</p>
            </div>
          </div>
          <button
            id="sidebar-signout-btn"
            onClick={handleSignOut}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
