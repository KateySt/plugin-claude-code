import { getCatalog } from "@/lib/catalog";
import { toSearchDocs } from "@/lib/search/index-docs";

export const dynamic = "force-static";

export function GET() {
  return Response.json(toSearchDocs(getCatalog()));
}
