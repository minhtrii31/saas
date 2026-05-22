import { CvDetailClient } from "./cv-detail-client";

export default async function CvDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CvDetailClient cvId={id} />;
}
