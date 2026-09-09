"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Brain,
  Zap,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  id: string;
  badge?: string;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "nav-dashboard" },
  { href: "/dashboard/practice", label: "Practice", icon: Zap, id: "nav-practice", badge: "AI" },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full w-full flex-col bg-sidebar/95 backdrop-blur-2xl border-r border-border/80 relative">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4.5 border-b border-border/60">
        <Link href={role === "teacher" ? "/teacher" : "/dashboard"} className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.06, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand glow-brand shadow-sm"
          >
            <Brain className="h-5 w-5 text-white animate-float" />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-bold text-base gradient-text tracking-tight group-hover:opacity-90 transition-opacity">
              LearnPulse
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-xs shadow-primary" />
              {role === "teacher" ? "Teacher Portal" : "Student Hub"}
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto scrollbar-thin" aria-label="Main navigation">
        <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Navigation
        </div>
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
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-xs shadow-primary/5"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-0.5"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30 tracking-tight">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="active-nav-dot"
                    className="h-1.5 w-1.5 rounded-full bg-primary shadow-xs shadow-primary"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User info & Signout */}
      <div className="border-t border-border/80 p-3">
        <div className="flex items-center justify-between rounded-xl p-2.5 glass-card border border-border/70 hover:border-primary/30 transition-all shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand text-white font-bold text-xs uppercase shadow-xs shrink-0">
              {fullName.charAt(0) || "U"}
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
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar/90 backdrop-blur-xl border-b border-border/70 z-40 flex items-center justify-between px-4">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-1 rounded-xl text-foreground hover:bg-accent transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href={role === "teacher" ? "/teacher" : "/dashboard"} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm gradient-text">LearnPulse</span>
        </Link>

        {/* Placeholder spacer to balance layout */}
        <div className="w-8" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-64 flex-col relative z-20 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Framer Motion) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
              aria-hidden="true"
            />

            {/* Off-canvas sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-72 z-50 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
