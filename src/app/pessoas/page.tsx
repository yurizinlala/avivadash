import { getPersons, getPersonStats } from "@/lib/actions/person-actions";
import { getCellsSimple } from "@/lib/actions/cell-actions";
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
  const page = Number(params.page ?? "1");
  const status = params.status ?? "";
  const baptized = params.baptized ?? "";
  const cell = params.cell ?? "";

  const [personsResult, stats, cells] = await Promise.all([
    getPersons({ search, type: tab, page, pageSize: 20, status, baptized, cell }),
    getPersonStats(),
    getCellsSimple(),
  ]);

  return (
    <PessoasClient
      initialData={personsResult.data}
      total={personsResult.total}
      page={personsResult.page}
      totalPages={personsResult.totalPages}
      stats={stats}
      cells={cells}
      currentSearch={search}
      currentTab={tab}
      currentStatus={status}
      currentBaptized={baptized}
      currentCell={cell}
    />
  );
}
