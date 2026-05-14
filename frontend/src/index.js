import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Assinatura da desenvolvedora — visível no DevTools de qualquer navegador
console.log(
  '%c🌿 Green Eye%c\n\nSistema de Monitoramento Ambiental\nDesenvolvido por Julyana Mira Medeiros\n\n🔗 LinkedIn: linkedin.com/in/julymira\n🐙 GitHub:   github.com/Julymira\n📧 E-mail:   julyanamcontato@gmail.com\n\n© 2026 — Todos os direitos reservados à autora.',
  'color: #2e7d32; font-size: 20px; font-weight: bold;',
  'color: #555; font-size: 13px; line-height: 1.8;'
);
