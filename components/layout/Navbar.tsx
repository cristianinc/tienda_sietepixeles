import Image from "next/image";
import Link from "next/link";
import { CartNavLink } from "@/components/cart/CartNavLink";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/admin", label: "Admin" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-muted)] bg-[var(--color-cream)]/90 backdrop-blur">
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/images/logo.jpg" alt="Sietepixeles" width={42} height={42} className="rounded-full object-cover" />
          <span className="font-serif text-xl font-semibold tracking-wide">Sietepixeles</span>
        </Link>
        <ul className="flex items-center gap-5 text-sm font-semibold uppercase tracking-[0.16em]">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="transition hover:text-[var(--color-clay)]">
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <CartNavLink />
          </li>
        </ul>
      </nav>
    </header>
  );
}
