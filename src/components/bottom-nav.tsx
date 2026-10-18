"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ListChecks, Users, CircleUser } from "lucide-react";
import { useAuth } from "@/lib/auth";

const tabs = [
  { href: "/queue", label: "Queue", icon: ListChecks },
  { href: "/councils", label: "Councils", icon: Users },
  { href: "/profile", label: "Profile", icon: CircleUser },
];

export function BottomNav() {
  const pathname = usePathname();
  const { session } = useAuth();

  const hiddenOn = ["/signin", "/signup", "/onboarding"];
  if (!session || hiddenOn.some((p) => pathname === p || pathname === `${p}/`)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-surface/90 backdrop-blur-md safe-bottom">
      <div className="max-w-md mx-auto flex pt-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1 py-1 text-center text-xs font-medium"
            >
              <motion.div
                animate={{ scale: active ? 1.08 : 1 }}
                className={active ? "text-indigo" : "text-ink-soft"}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              </motion.div>
              <span className={active ? "text-indigo" : "text-ink-soft"}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
