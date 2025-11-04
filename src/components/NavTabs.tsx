export function NavTabs({
  tab, onTab
}: { tab: "today" | "history"; onTab: (t: "today"|"history"|"routine") => void }) {
  return (
    <nav className="tabs">
      <div className={`tab ${tab==="today"?"active":""}`} onClick={()=>onTab("today")}>Hoy</div>
      <div className={`tab ${tab==="history"?"active":""}`} onClick={()=>onTab("history")}>Historial</div>
      <div className={`tab ${tab==="routine"?"active":""}`} onClick={()=>onTab("routine")}>Rutina</div>
    </nav>
  );
}
