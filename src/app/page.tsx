import HomeClient from "@/screens/HomeClient";

export const revalidate = 60;

export const metadata = {
  title: "The Curious Empire | Premium Shopping Experience In Bangladesh",
  description:
    "The Curious Empire offers premium shopping with curated products, fast delivery, and trusted quality—shop confidently every day.",
  alternates: { canonical: "https://thecuriousempire.com/" },
  openGraph: {
    title: "The Curious Empire | Premium Shopping Experience In Bangladesh",
    description:
      "The Curious Empire offers premium shopping with curated products, fast delivery, and trusted quality—shop confidently every day.",
    url: "https://thecuriousempire.com/",
    images: ["https://thecuriousempire.com/og.png"],
    type: "website",
  },
};

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function getHomeData() {
  // Prefer server-only API_BASE if set; fallback to NEXT_PUBLIC_API_BASE (you have both in Vercel)
  const apiBase =
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "https://api.thecuriousempire.com";

  const base = apiBase.replace(/\/$/, "");

  const [cRes, bRes, pRes] = await Promise.all([
    fetch(`${base}/api/categories`, { next: { revalidate: 300 } }),
    fetch(`${base}/api/banners`, { next: { revalidate: 300 } }),
    fetch(`${base}/api/products`, { next: { revalidate: 60 } }),
  ]);

  const c = (await safeJson(cRes)) || {};
  const b = (await safeJson(bRes)) || {};
  const p = (await safeJson(pRes)) || {};

  return {
    apiBase: base,
    cats: Array.isArray((c as any)?.categories) ? (c as any).categories : [],
    banners: Array.isArray((b as any)?.banners) ? (b as any).banners : [],
    products: Array.isArray((p as any)?.products) ? (p as any).products : [],
  };
}

export default async function Page() {
  const data = await getHomeData();
  return <HomeClient {...data} />;
}