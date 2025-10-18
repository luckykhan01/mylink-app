import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState('');
  const [aiStatus, setAiStatus] = useState('');

  useEffect(() => {
    // Проверка статуса backend API
    axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/`)
      .then(response => {
        setApiStatus(response.data.message);
      })
      .catch(error => {
        setApiStatus('Backend недоступен');
      });

    // Проверка статуса AI сервиса
    axios.get(`${process.env.REACT_APP_AI_URL || 'http://localhost:8001'}/`)
      .then(response => {
        setAiStatus(response.data.message);
      })
      .catch(error => {
        setAiStatus('AI сервис недоступен');
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MyLink Frontend</h1>
        <div className="status-container">
          <div className="status-item">
            <h3>Backend API</h3>
            <p className={apiStatus.includes('недоступен') ? 'error' : 'success'}>
              {apiStatus || 'Проверка...'}
            </p>
          </div>
          <div className="status-item">
            <h3>AI Assistant</h3>
            <p className={aiStatus.includes('недоступен') ? 'error' : 'success'}>
              {aiStatus || 'Проверка...'}
            </p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
