"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDeadlineAlert } from "@/lib/use-deadline-alert";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "My Profile" },
  { href: "/schools", label: "Schools" },
  { href: "/strengthen", label: "Strengthen" },
  { href: "/essay", label: "Essay Coach" },
  { href: "/tours", label: "Tours" },
  { href: "/career", label: "Career Test" },
  { href: "/deadlines", label: "Deadlines" },
];

export function Nav() {
  const pathname = usePathname();
  const deadlineAlerts = useDeadlineAlert();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-brand-700">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 fill-brand-600"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 3L2 9l10 6 10-6-10-6zM2 15l10 6 10-6M2 12l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            College Compass
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const showBadge = link.href === "/deadlines" && deadlineAlerts > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {link.label}
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {deadlineAlerts > 9 ? "9+" : deadlineAlerts}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile nav */}
          <div className="md:hidden flex items-center gap-1 overflow-x-auto">
            {links.map((link) => {
              const showBadge = link.href === "/deadlines" && deadlineAlerts > 0;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                    pathname === link.href
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {link.label}
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {deadlineAlerts > 9 ? "9+" : deadlineAlerts}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
