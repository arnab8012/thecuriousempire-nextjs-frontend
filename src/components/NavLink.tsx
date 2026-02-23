"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ to, href, className, end = false, ...props }) {
  const pathname = usePathname() || "/";
  const target = href ?? to ?? "/";

  const isActive = end ? pathname === target : pathname === target || pathname.startsWith(target + "/");

  const cls = typeof className === "function" ? className({ isActive }) : className;

  return <NextLink href={target} className={cls} {...props} />;
}
