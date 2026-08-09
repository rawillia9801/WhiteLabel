import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RealOSDemoClient from "../real-os-demo-client";
import { demoKennels } from "../demo-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const kennel = demoKennels[slug];
  if (!kennel) return { title: "Breeder OS Demo | MyDogPortal" };
  return {
    title: `${kennel.name} OS Demo | MyDogPortal`,
    description: `Explore a read-only MyDogPortal breeder operating system populated with realistic sample data for ${kennel.name}.`,
  };
}

export default async function BreederOSDemoPage({ params }: Props) {
  const { slug } = await params;
  const kennel = demoKennels[slug];
  if (!kennel) notFound();
  return <RealOSDemoClient kennel={kennel} />;
}
