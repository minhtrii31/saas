type AvatarProps = {
  name?: string | null;
  email?: string | null;
  className?: string;
};

function getInitials(name?: string | null, email?: string | null) {
  const label = name?.trim() || email?.trim() || "User";
  const parts = label.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

export function Avatar({ name, email, className = "" }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center border border-zinc-300 bg-zinc-950 text-xs font-bold text-white ${className}`}
    >
      {getInitials(name, email)}
    </span>
  );
}
