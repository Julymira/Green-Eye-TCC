// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import './App.css'; 

// Importando as páginas
import Home from './Home';
import NovaDenuncia from './NovaDenuncia';
import Login from './Login';
import Dashboard from './Dashboard';
import RegisterCompany from './RegisterCompany';
import LoginCompany from './LoginCompany';
import DashboardCompany from './DashboardCompany';

// --- NOVO: Layout para as páginas públicas (Com a Navbar padrão) ---
function LayoutPublico() {
  return (
    <>
      <nav className="navbar">
        <div className="brand">
          <Link to="/">🌿 Green Eye</Link>
        </div>
        <div className="nav-links">
          <Link to="/denunciar">+ Denunciar</Link>
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
      <div className="App">
        <Routes>
          
          {/* GRUPO 1: Páginas Públicas (Usam o Layout com Navbar "Green Eye") */}
          <Route element={<LayoutPublico />}>
            <Route path="/" element={<Home />} />
            <Route path="/denunciar" element={<NovaDenuncia />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro-empresa" element={<RegisterCompany />} />
            <Route path="/login-empresa" element={<LoginCompany />} />
            <Route path="/dashboard-empresa" element={<DashboardCompany />} />
            
          </Route>

          {/* GRUPO 2: Área Admin (Sem Layout padrão, usa a própria Navbar) */}
          <Route path="/admin" element={<Dashboard />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;