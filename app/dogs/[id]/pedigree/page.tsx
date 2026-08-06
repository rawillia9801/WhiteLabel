import { PedigreeWorkspace } from "../../../../components/pedigree-workspace";

export default async function DogPedigreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PedigreeWorkspace dogId={Number(id)} />;
}
