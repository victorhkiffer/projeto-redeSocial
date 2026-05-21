import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import PublicLayout from './layouts/PublicLayout'
import Dashboard from './pages/app/Dashboard'
import Feed from './pages/app/Feed'
import Search from './pages/app/Search'
import Chat from './pages/app/Chat'
import Reviews from './pages/app/Reviews'
import Services from './pages/app/Services'
import Representatives from './pages/app/Representatives'
import CompanyProfile from './pages/app/CompanyProfile'
import ProfileSettings from './pages/app/ProfileSettings'
import Landing from './pages/public/Landing'
import Login from './pages/public/Login'
import Register from './pages/public/Register'
import RecoverPassword from './pages/public/RecoverPassword'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Register />} />
        <Route path="recuperar-senha" element={<RecoverPassword />} />
      </Route>

      <Route path="app" element={<AppLayout />}>
        <Route index element={<Navigate to="feed" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="feed" element={<Feed />} />
        <Route path="pesquisa" element={<Search />} />
        <Route path="empresa/:id" element={<CompanyProfile />} />
        <Route path="configuracoes/perfil" element={<ProfileSettings />} />
        <Route path="representantes" element={<Representatives />} />
        <Route path="servicos" element={<Services />} />
        <Route path="chat" element={<Chat />} />
        <Route path="avaliacoes" element={<Reviews />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
