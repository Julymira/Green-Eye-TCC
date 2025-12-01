// src/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import Mapa from './Mapa';

function Home() {
  return (
    <div>
      {/* 1. Seção de Boas-vindas */}
      <section className="welcome-section">
        <h2>Bem-vindo ao Green Eye 🌱</h2>
        <p>
          O <strong>Green Eye</strong> é um sistema de monitoramento ambiental criado para identificar e combater o descarte irregular de lixo em Luziânia-GO. Nossa missão é ajudar a manter a cidade limpa, saudável e sustentável. Por meio de geolocalização e denúncias comunitárias, queremos mapear os pontos críticos e auxiliar o poder público na solução desse problema.
        </p>
      </section>

      {/* 2. O Mapa */}
      <Mapa />

      {/* 3. Seção "O que você pode fazer aqui?" COM TÍTULO E BOTÕES */}
      <section className="steps-section">
        {/* AQUI ESTÁ O TÍTULO QUE FALTOU */}
        <h2>O que você pode fazer aqui?</h2>

        <div className="cards-container">
          
          {/* CARD 1: Denunciar */}
          <div className="card-action">
            <div>
              <h3>📌 1. Cadastrar Denúncia</h3>
              <p>
                Identificou um local com lixo descartado de forma irregular? 
                Clique abaixo para marcar o local e descrever o problema.
              </p>
            </div>
            {/* Botão Verde */}
            <Link to="/denunciar" className="btn-card bg-green">Cadastrar Denúncia</Link>
          </div>

          {/* CARD 2: Admin */}
          <div className="card-action">
            <div>
              <h3>🛡️ 2. Área Administrativa</h3>
              <p>
                Acesso restrito para administradores. Valide denúncias, 
                gerencie dados e acompanhe as estatísticas da cidade.
              </p>
            </div>
            {/* Botão Laranja */}
            <Link to="/login" className="btn-card bg-orange">Acesso Administrativo</Link>
          </div>

        </div>
      </section>
    </div>
  );
}

export default Home;