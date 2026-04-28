'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SunIcon, MoonIcon, WifiIcon, XMarkIcon, SparklesIcon, CloudIcon, BoltIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import DashboardCard from '../components/DashboardCard';

const initialMetrics = [
  { key: 'ph', label: 'pH - (Baku Mutu 6-9)', value: 0, unit: '', description: 'Keseimbangan asam basa dalam air.' },
  { key: 'turbidity', label: 'Turbidity', value: 0, unit: 'NTU', description: 'Kejernihan air dalam satuan NTU.' },
  { key: 'cond', label: 'Conductivity', value: 0, unit: 'µS/cm', description: 'Kemampuan penghantaran listrik air.' },
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
    return 'Hasil Pembacaan - performa stabil.';
  } else {
    const issues = [];
    if (!phNormal) issues.push('pH abnormal');
    if (!turbidityNormal) issues.push('turbidity tinggi');
    if (!conductivityNormal) issues.push('conductivity abnormal');

    return `Hasil Pembacaan - ${issues.join(', ')}.`;
  }
};

const metricIcons = {
  ph: SparklesIcon,
  turbidity: CloudIcon,
  cond: BoltIcon,
};

export default function Page() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [currentTime, setCurrentTime] = useState(null);
  const [online, setOnline] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [mode, setMode] = useState('dark');
  const [socketConnected, setSocketConnected] = useState(false);

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
    if (typeof window === 'undefined') return;

    const websocketUrl =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      `ws://localhost:8080`;

    const socket = new WebSocket(websocketUrl);

    socket.addEventListener('open', () => {
      setSocketConnected(true);
      setOnline(true);
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        const eventType = payload.event || null;
        const data = payload.data ?? payload;

        if (eventType === 'main-reading.latest' && data) {
          setMetrics((prev) =>
            prev.map((metric) => {
              if (data?.[metric.key] !== undefined && !Number.isNaN(Number(data[metric.key]))) {
                return {
                  ...metric,
                  value: Number(data[metric.key]),
                };
              }
              return metric;
            })
          );
          setUpdatedAt(new Date());
        } else if (eventType === 'main-reading.error') {
          console.warn('WebSocket server reported error:', data?.message || payload.message);
        } else if (data && (data.ph !== undefined || data.turbidity !== undefined || data.cond !== undefined)) {
          setMetrics((prev) =>
            prev.map((metric) => {
              if (data?.[metric.key] !== undefined && !Number.isNaN(Number(data[metric.key]))) {
                return {
                  ...metric,
                  value: Number(data[metric.key]),
                };
              }
              return metric;
            })
          );
          setUpdatedAt(new Date());
        }
      } catch (error) {
        console.warn('WebSocket message parse failed', error);
      }
    });

    socket.addEventListener('close', () => {
      setSocketConnected(false);
      setOnline(false);
    });

    socket.addEventListener('error', () => {
      setSocketConnected(false);
      setOnline(false);
    });

    return () => {
      socket.close();
    };
  }, []);

  return (
    <main className="page-shell">
      <div className="device-shell">
        <section className="dashboard-panel">
          <div className="top-bar">
            <div className="device-title">
              <Image src="/sensync-logo.png" alt="Sensync logo" width={28} height={28} className="device-logo" />
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
              <span
                className={`signal ${online ? 'online' : 'offline'}`}
                role="status"
                aria-label={online ? 'Online' : 'Offline'}
              >
                <span className="signal-icon-wrap">
                  <WifiIcon className="signal-svg" />
                  {!online && <XMarkIcon className="signal-overlay" />}
                </span>
              </span>
              <span className="clock">{currentTime ? formatClock(currentTime) : '--:--:--'}</span>
            </div>
          </div>

          <div className="readout-header">
            <div>
              <p className="eyebrow">Pembacaan Sensor</p>
              <h1>pH · Turbidity · Conductivity</h1>
            </div>
            <div className="last-update">Last sync {updatedAt ? formatClock(updatedAt) : '–'}</div>
          </div>

          <div className="metrics-grid">
            {metrics.map((metric) => (
              <DashboardCard
                key={metric.key}
                label={metric.label}
                Icon={metricIcons[metric.key]}
                value={metric.value.toFixed(2)}
                unit={metric.unit}
                description={metric.description}
              />
            ))}
          </div>

          <div className="footer-note">
            // <span className="footer-summary">
            //   <DocumentTextIcon className="summary-icon" />
            //   {getSensorStatus(metrics)}
            // </span>
            <small className="watermark">© sensync {new Date().getFullYear()}</small>
          </div>
        </section>
      </div>
    </main>
  );
}
