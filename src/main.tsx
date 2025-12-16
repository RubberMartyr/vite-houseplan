import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './reset.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container missing in index.html');
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  container,
);
