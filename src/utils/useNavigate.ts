import { useRouter } from "next/navigation";

export function useNavigate() {
  const router = useRouter();

  return (to: string, options?: { replace?: boolean }) => {
    if (options?.replace) router.replace(to);
    else router.push(to);
  };
}