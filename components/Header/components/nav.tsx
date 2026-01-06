import Link from "next/link";

export default function Nav() {
  return (
    <nav className="hidden sm:flex items-center gap-2">
      <Link 
        href="/recommend" 
        className="text-sm text-muted hover:text-foreground"
      >
        GITHUB开源项目推荐
      </Link>
    </nav>
  );
}
