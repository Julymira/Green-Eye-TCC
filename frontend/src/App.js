// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Importando as páginas
import Home from './Home';
import NovaOcorrencia from './NovaOcorrencia';
import Login from './Login';
import Dashboard from './Dashboard';
import RegisterCompany from './RegisterCompany';
import LoginCompany from './LoginCompany';
import DashboardCompany from './DashboardCompany';
import ChangePassword from './ChangePassword';
import TutorialGestor from './TutorialGestor';
import TutorialEmpresa from './TutorialEmpresa';
import HistoricoGestor from './HistoricoGestor';
import HistoricoEmpresa from './HistoricoEmpresa';
import Relatorios from './Relatorios';
import NovaOcorrenciaGestor from './NovaOcorrenciaGestor';

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
            
          </Route>

          {/* GRUPO 2: Área Admin (Sem Layout padrão, usa a própria Navbar) */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/tutorial" element={<TutorialGestor />} />
          <Route path="/admin/historico" element={<HistoricoGestor />} />
          <Route path="/admin/relatorios" element={<Relatorios />} />
          <Route path="/admin/nova-ocorrencia" element={<NovaOcorrenciaGestor />} />
          <Route path="/dashboard-empresa" element={<DashboardCompany />} />
          <Route path="/dashboard-empresa/tutorial" element={<TutorialEmpresa />} />
          <Route path="/dashboard-empresa/historico" element={<HistoricoEmpresa />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;