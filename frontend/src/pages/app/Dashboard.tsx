export default function Dashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid gap-3 md:grid-cols-3">
        {['Serviços em aberto', 'Jobs em andamento', 'Avaliações recentes'].map((title) => (
          <div key={title} className="rounded-xl border border-[color:var(--border)] p-4">
            <div className="text-sm text-[color:var(--muted)]">{title}</div>
            <div className="mt-2 text-2xl font-semibold">0</div>
          </div>
        ))}
      </div>
    </div>
  )
}
