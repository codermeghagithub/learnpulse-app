"use client";

import { useState, useEffect } from "react";
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
  Compass,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  id: string;
  badge?: string;
}

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, id: "nav-dashboard" },
  { href: "/dashboard/courses", label: "Course Catalog", icon: Compass, id: "nav-courses" },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = role === "teacher" ? TEACHER_NAV : STUDENT_NAV;

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close drawer automatically on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full w-full flex-col bg-sidebar border-r-2 border-border relative">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border">
        <Link href={role === "teacher" ? "/teacher" : "/dashboard"} className="flex items-center gap-3 group min-h-11">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)]">
            <Brain className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base text-foreground font-heading tracking-tight group-hover:text-primary transition-colors">
              LearnPulse
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-xs bg-primary border border-border" />
              {role === "teacher" ? "Teacher Portal" : "Student Hub"}
            </span>
          </div>
        </Link>

        {/* Theme Toggle & Mobile Close */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden min-h-11 min-w-11 cursor-pointer"
            aria-label="Close sidebar drawer"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </Button>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3.5 py-4 space-y-2 overflow-y-auto scrollbar-thin" aria-label="Main navigation">
        <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
                "group relative flex items-center justify-between rounded-md px-3.5 py-2.5 min-h-11 text-sm font-medium transition-all duration-100 cursor-pointer",
                isActive
                  ? "bg-[#151313] text-[#FFFFFF] border-2 border-[#151313] dark:bg-[#F7F7F5] dark:text-[#151313] dark:border-[#F7F7F5] shadow-[2px_2px_0px_var(--shadow-color)]"
                  : "border-2 border-transparent text-foreground hover:border-border hover:bg-card hover:shadow-[2px_2px_0px_var(--shadow-color)]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 stroke-[2.5] transition-transform duration-100 group-hover:scale-110",
                    isActive
                      ? "text-primary"
                      : "text-foreground group-hover:text-primary"
                  )}
                />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <Badge
                    variant={isActive ? "primary" : "outline"}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
                {isActive && (
                  <motion.span
                    layoutId="active-nav-dot"
                    className="h-2 w-2 rounded-xs bg-primary border border-border"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User info & Signout */}
      <div className="p-3.5 pb-safe">
        <div className="flex items-center justify-between rounded-lg p-3 bg-card border-2 border-border shadow-[2px_2px_0px_var(--shadow-color)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground border-2 border-border font-heading font-semibold text-xs uppercase shadow-[1px_1px_0px_var(--shadow-color)] shrink-0">
              {fullName.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate leading-tight text-foreground">{fullName}</p>
              <p className="text-[10px] font-normal text-muted-foreground capitalize leading-tight mt-0.5">{role}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            id="sidebar-signout-btn"
            onClick={handleSignOut}
            className="min-h-10 min-w-10 rounded-md hover:bg-destructive hover:text-destructive-foreground hover:border-border cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4.5 w-4.5 stroke-[2.5]" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar with Sticky Header (<1024px) */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b-2 border-border bg-background/95 backdrop-blur-md px-4 lg:hidden">
        <Link
          href={role === "teacher" ? "/teacher" : "/dashboard"}
          className="flex items-center gap-2.5 min-h-11"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground border-2 border-border shadow-[1px_1px_0px_var(--shadow-color)]">
            <Brain className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground font-heading leading-tight">LearnPulse</span>
            <span className="text-[10px] text-muted-foreground font-medium leading-tight">
              {role === "teacher" ? "Teacher Portal" : "Student Hub"}
            </span>
          </div>
        </Link>

        {/* Right controls: Hamburger */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="min-h-11 min-w-11 rounded-md border-2 border-border bg-card text-foreground shadow-[2px_2px_0px_var(--shadow-color)] hover:shadow-[3px_3px_0px_var(--shadow-color)] cursor-pointer"
            aria-label="Open navigation drawer"
          >
            <Menu className="h-5 w-5 stroke-[2.5]" />
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar (1024px+) */}
      <aside className="hidden lg:flex h-screen w-64 lg:w-72 flex-col relative z-20 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Framer Motion Side-Over Sheet) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-xs"
              aria-hidden="true"
            />

            {/* Off-canvas sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="lg:hidden fixed top-0 bottom-0 left-0 w-72 sm:w-80 max-w-[85vw] z-50 border-r-2 border-border shadow-[4px_4px_0px_var(--shadow-color)] bg-sidebar flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
