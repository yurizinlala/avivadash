export const dynamic = "force-dynamic";
import { getPersons, getPeopleSimple, getPersonStats } from "@/lib/actions/person-actions";
import { getCellsSimple } from "@/lib/actions/cell-actions";
import { getChurchLocations } from "@/lib/actions/church-location-actions";
import { PessoasClient } from "./pessoas-client";

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    tab?: string;
    page?: string;
    status?: string;
    baptized?: string;
    cell?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const tab = params.tab ?? "todos";
  const rawPage = Number(params.page ?? "1");
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
  const status = params.status ?? "";
  const baptized = params.baptized ?? "";
  const cell = params.cell ?? "";

  const [personsResult, stats, cells, churchLocations, people] = await Promise.all([
    getPersons({ search, type: tab, page, pageSize: 20, status, baptized, cell }),
    getPersonStats(),
    getCellsSimple(),
    getChurchLocations(),
    getPeopleSimple(),
  ]);

  return (
    <PessoasClient
      initialData={personsResult.data}
      total={personsResult.total}
      page={personsResult.page}
      totalPages={personsResult.totalPages}
      stats={stats}
      cells={cells}
      churchLocations={churchLocations}
      people={people}
      currentSearch={search}
      currentTab={tab}
      currentStatus={status}
      currentBaptized={baptized}
      currentCell={cell}
    />
  );
}
