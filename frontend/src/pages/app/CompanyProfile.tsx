import { useParams } from 'react-router-dom'

export default function CompanyProfile() {
  const { id } = useParams()
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Empresa</h1>
      <p className="text-sm text-[color:var(--muted)]">Perfil da empresa: {id}</p>
    </div>
  )
}
