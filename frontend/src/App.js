// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/App.css';

// Importando as páginas
import Home from './pages/public/Home';
import NovaOcorrencia from './pages/public/NovaOcorrencia';
import Login from './pages/public/Login';
import Dashboard from './pages/gestor/Dashboard';
import RegisterCompany from './pages/public/RegisterCompany';
import LoginCompany from './pages/public/LoginCompany';
import DashboardCompany from './pages/company/DashboardCompany';
import ChangePassword from './pages/public/ChangePassword';
import TutorialGestor from './pages/gestor/TutorialGestor';
import TutorialEmpresa from './pages/company/TutorialEmpresa';
import HistoricoGestor from './pages/gestor/HistoricoGestor';
import HistoricoEmpresa from './pages/company/HistoricoEmpresa';
import Relatorios from './pages/gestor/Relatorios';
import NovaOcorrenciaGestor from './pages/gestor/NovaOcorrenciaGestor';
import PainelSuperAdmin from './pages/superadmin/PainelSuperAdmin';
import TutorialSuperAdmin from './pages/superadmin/TutorialSuperAdmin';
import PontosColeta from './pages/public/PontosColeta';
import GestaoPontosColeta from './pages/gestor/GestaoPontosColeta';

// --- NOVO: Layout para as páginas públicas (Com a Navbar padrão) ---
function LayoutPublico() {
  return (
    <>
      <nav className="navbar">
        <div className="brand">
          <Link to="/">🌿 Green Eye</Link>
        </div>
        <div className="nav-links">
          <Link to="/ocorrencia">Nova Ocorrência</Link>
          <Link to="/login-empresa">Empresas</Link> 
          <Link to="/login">Gestores</Link>
          <Link to="/pontos-coleta">Pontos de Coleta</Link>
        </div>
      </nav>
      
      {/* O Outlet é onde o React vai desenhar a página filha (Home, Login, etc) */}
      <Outlet />
    </>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <div className="App">
        <Routes>
          
          {/* GRUPO 1: Páginas Públicas (Usam o Layout com Navbar "Green Eye") */}
          <Route element={<LayoutPublico />}>
          <Route path="/" element={<Home />} />
          <Route path="/ocorrencia" element={<NovaOcorrencia />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro-empresa" element={<RegisterCompany />} />
          <Route path="/login-empresa" element={<LoginCompany />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/pontos-coleta" element={<PontosColeta />} />

          </Route>

          {/* GRUPO 2: Área Admin (Sem Layout padrão, usa a própria Navbar) */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/tutorial" element={<TutorialGestor />} />
          <Route path="/admin/historico" element={<HistoricoGestor />} />
          <Route path="/admin/relatorios" element={<Relatorios />} />
          <Route path="/admin/nova-ocorrencia" element={<NovaOcorrenciaGestor />} />
          <Route path="/admin/pontos-coleta" element={<GestaoPontosColeta />} />
          <Route path="/superadmin" element={<PainelSuperAdmin />} />
          <Route path="/superadmin/tutorial" element={<TutorialSuperAdmin />} />
          <Route path="/dashboard-empresa" element={<DashboardCompany />} />
          <Route path="/dashboard-empresa/tutorial" element={<TutorialEmpresa />} />
          <Route path="/dashboard-empresa/historico" element={<HistoricoEmpresa />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;