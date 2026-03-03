import HomeClient from "@/screens/HomeClient";

export const revalidate = 120;

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
  const apiBase =
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "https://api.thecuriousempire.com";

  const base = apiBase.replace(/\/$/, "");

  // ✅ Only 1 request (best)
  const res = await fetch(`${base}/api/home`, {
    next: { revalidate: 120 }, // 2 min cache
  });

  const data = (await safeJson(res)) || {};

  return {
    apiBase: base,
    cats: Array.isArray(data?.categories) ? data.categories : [],
    banners: Array.isArray(data?.banners) ? data.banners : [],
    productsByCategory: data?.productsByCategory || {},
  };
}

export default async function Page() {
  const data = await getHomeData();
  return <HomeClient {...data} />;
}