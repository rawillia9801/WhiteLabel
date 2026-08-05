import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buyer Puppy Portal",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
