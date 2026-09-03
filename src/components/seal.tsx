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
        background: `hsl(${user.hue} 45% 92%)`,
        color: `hsl(${user.hue} 45% 30%)`,
        ["--tw-ring-color" as string]: `hsl(${user.hue} 45% 78%)`,
      }}
      title={user.name}
    >
      {initials(user.name)}
    </div>
  );
}
