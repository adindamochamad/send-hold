import { ProductPlanEditor } from "../../components/ProductPlanEditor";
import type { Id } from "@/convex/_generated/dataModel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlanPage({ params }: PageProps) {
  const { id } = await params;
  return <ProductPlanEditor planId={id as Id<"plans">} />;
}
