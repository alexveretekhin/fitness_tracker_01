import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ListRow, Panel, SearchField } from "../components/ui";
import { exercises, muscleGroups } from "../data/exercises";

// Список групп мышц. Поиск ищет и по группам, и по упражнениям.
export function MuscleGroups() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const groups = muscleGroups.filter((g) => g.name.toLowerCase().includes(query));
  const found = query ? exercises.filter((e) => e.name.toLowerCase().includes(query)) : [];

  return (
    <Panel className="flex-1 overflow-y-auto">
      <SearchField value={q} onChange={setQ} />
      {groups.map((g) => (
        <ListRow
          key={g.id}
          upper
          onClick={() => navigate({ to: "/muscles/$groupId", params: { groupId: g.id } })}
        >
          {g.name}
        </ListRow>
      ))}
      {found.map((e) => (
        <ListRow
          key={e.id}
          muted
          onClick={() => navigate({ to: "/muscles/$groupId", params: { groupId: e.groupId } })}
        >
          {e.name}
        </ListRow>
      ))}
    </Panel>
  );
}
