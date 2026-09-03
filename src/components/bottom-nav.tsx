"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const tabs = [
  { href: "/queue", label: "Queue" },
  { href: "/councils", label: "Councils" },
  { href: "/profile", label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { session } = useAuth();

  if (!session || pathname === "/signin" || pathname === "/signup") return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-surface/90 backdrop-blur-md">
      <div className="max-w-md mx-auto flex">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
                active ? "text-indigo" : "text-ink-soft"
              }`}
            >
              <span
                className={`inline-block ${
                  active ? "border-b-2 border-indigo pb-2 -mb-2" : ""
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
