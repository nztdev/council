import type { User } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

// Each person keeps their own hue; how light/dark it is comes from the
// active theme (--seal-*-l in src/app/globals.css) so seals stay readable
// on both light and dark themes.
export function Seal({
  user,
  size = "md",
}: {
  user: User;
  size?: keyof typeof sizes;
}) {
  return (
    <div
      className={`${sizes[size]} shrink-0 rounded-full flex items-center justify-center font-display font-semibold ring-2 ring-offset-2 ring-offset-stone`}
      style={{
        background: `hsl(${user.hue} 45% var(--seal-bg-l))`,
        color: `hsl(${user.hue} 45% var(--seal-fg-l))`,
        ["--tw-ring-color" as string]: `hsl(${user.hue} 45% var(--seal-ring-l))`,
      }}
      title={user.name}
    >
      {initials(user.name)}
    </div>
  );
}
