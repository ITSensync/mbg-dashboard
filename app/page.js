'use client';

import { useEffect, useState } from 'react';
import DashboardCard from '../components/DashboardCard';

const initialMetrics = [
  { key: 'ph', label: 'pH', value: 7.45, unit: '', description: 'Keseimbangan asam basa dalam air.' },
  { key: 'turbidity', label: 'Turbidity', value: 1.32, unit: 'NTU', description: 'Kejernihan air dalam satuan NTU.' },
  { key: 'conductivity', label: 'Conductivity', value: 420.8, unit: 'µS/cm', description: 'Kemampuan penghantaran listrik air.' },
];

const formatClock = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const getSensorStatus = (metrics) => {
  const ph = metrics.find(m => m.key === 'ph')?.value || 0;
  const turbidity = metrics.find(m => m.key === 'turbidity')?.value || 0;
  const conductivity = metrics.find(m => m.key === 'conductivity')?.value || 0;

  // Rentang normal
  const phNormal = ph >= 6.5 && ph <= 8.5;
  const turbidityNormal = turbidity < 5;
  const conductivityNormal = conductivity >= 100 && conductivity <= 1000; // contoh range

  const allNormal = phNormal && turbidityNormal && conductivityNormal;

  if (allNormal) {
    return 'Sensor membaca kondisi air saat ini — performa stabil.';
  } else {
    const issues = [];
    if (!phNormal) issues.push('pH abnormal');
    if (!turbidityNormal) issues.push('turbidity tinggi');
    if (!conductivityNormal) issues.push('conductivity abnormal');

    return `Sensor mendeteksi kondisi air — ${issues.join(', ')}.`;
  }
};

export default function Page() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [online, setOnline] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const [mode, setMode] = useState('dark');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedMode = window.localStorage.getItem('theme-mode');
    if (savedMode === 'light' || savedMode === 'dark') {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem('theme-mode', mode);
    document.documentElement.classList.toggle('light-mode', mode === 'light');
  }, [mode]);

  useEffect(() => {
    const tick = () => setCurrentTime(new Date());
    tick();
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, []);

  const checkOnlineStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      setOnline(true);
    } catch (error) {
      setOnline(false);
    }
  };

  useEffect(() => {
    // Check immediately
    checkOnlineStatus();

    // Check every 30 seconds
    const interval = setInterval(checkOnlineStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => {
          const variation = (Math.random() - 0.5) * 0.2;
          return {
            ...metric,
            value: Number(Math.max(0, metric.value + variation).toFixed(2)),
          };
        })
      );
      setUpdatedAt(new Date());
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="page-shell">
      <div className="device-shell">
        <section className="dashboard-panel">
          <div className="top-bar">
            <div className="device-title">
              <span style={{ fontWeight: 'bold' }}>Sensync</span>
              <span>|</span>
              <span>MBG</span>
            </div>
            <div className="status-group">
              <button
                type="button"
                className="theme-toggle"
                aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={() => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              >
                {mode === 'dark' ? '☀️' : '🌙'}
              </button>
              <span className={`signal ${online ? 'online' : 'offline'}`}>
                {online ? 'ONLINE' : 'OFFLINE'}
              </span>
              <span className="clock">{formatClock(currentTime)}</span>
            </div>
          </div>

          <div className="readout-header">
            <div>
              <p className="eyebrow">Pembacaan Sensor</p>
              <h1>pH · Turbidity · Conductivity</h1>
            </div>
            <div className="last-update">Last sync {formatClock(updatedAt)}</div>
          </div>

          <div className="metrics-grid">
            {metrics.map((metric) => (
              <DashboardCard
                key={metric.key}
                label={metric.label}
                value={metric.value.toFixed(2)}
                unit={metric.unit}
                description={metric.description}
              />
            ))}
          </div>

          <div className="footer-note">
            <span>{getSensorStatus(metrics)}</span>
            <small className="watermark">© sensync {new Date().getFullYear()}</small>
          </div>
        </section>
      </div>
    </main>
  );
}
