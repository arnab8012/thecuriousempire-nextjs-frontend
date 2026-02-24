"use client";

import { useParams as useNextParams } from "next/navigation";

export function useParams<T extends Record<string, string>>() {
  return useNextParams() as unknown as T;
}