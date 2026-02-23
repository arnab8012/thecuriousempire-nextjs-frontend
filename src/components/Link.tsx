"use client";

import NextLink from "next/link";

// React Router Link compatible: <Link to="/path" />
export default function Link({ to, href, ...props }) {
  return <NextLink href={href ?? to ?? "#"} {...props} />;
}
