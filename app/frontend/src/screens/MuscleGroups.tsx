import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMuscleGroups } from "../api";
import { searchExercisesOptions } from "../api/generated/@tanstack/react-query.gen";
import { ListRow, Panel, QueryState, SearchField } from "../components/ui";

// Список групп мышц. Поиск ищет и по группам, и по упражнениям.
export function MuscleGroups() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const groupsQuery = useMuscleGroups();
  // Поиск упражнений идёт на сервере, запрос отправляется только когда что-то введено
  const found = useQuery({ ...searchExercisesOptions({ query: { q: query } }), enabled: !!query });

  const groups = (groupsQuery.data ?? []).filter((g) => g.name.toLowerCase().includes(query));

  return (
    <Panel className="flex-1 overflow-y-auto">
      <SearchField value={q} onChange={setQ} />
      <QueryState isPending={groupsQuery.isPending} isError={groupsQuery.isError} />
      {groups.map((g) => (
        <ListRow
          key={g.id}
          upper
          onClick={() => navigate({ to: "/muscles/$groupId", params: { groupId: g.id } })}
        >
          {g.name}
        </ListRow>
      ))}
      {query &&
        found.data?.map((e) => (
          <ListRow
            key={e.id}
            muted
            onClick={() => {
              const groupId = e.primary_muscles[0];
              if (groupId) navigate({ to: "/muscles/$groupId", params: { groupId } });
            }}
          >
            {e.name}
          </ListRow>
        ))}
    </Panel>
  );
}
