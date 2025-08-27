import React, { useEffect, useState, useCallback } from 'react';
import './Dashboard.css';
import logo from '../assets/lynx-logo.png';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { fetchStats, fetchPolicies, fetchPieData } from '../mockApi';

Chart.register(ArcElement, Tooltip, Legend);

type Stat = {
  label: string;
  value: string | number;
  delta?: string;
};

type Policy = {
  type: string;
  description: string;
  example: string;
};

const StatCard: React.FC<{ stat: Stat; draggable?: boolean }> = ({ stat }) => (
  <div className="stat-card" draggable>
    <div className="stat-value">{stat.value}</div>
    <div className="stat-label">{stat.label}</div>
    {stat.delta && <div className="stat-delta">{stat.delta}</div>}
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [pieData, setPieData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, p, pie] = await Promise.all([fetchStats(), fetchPolicies(), fetchPieData()]);
      if (!mounted) return;
      setStats(s);
      setPolicies(p);
      setPieData(pie);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Simple drag/drop to reorder stat cards or panels
  const onDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropStat = (e: React.DragEvent, targetIdx: number) => {
    const src = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(src)) return;
    e.preventDefault();
    const copy = [...stats];
    const [item] = copy.splice(src, 1);
    copy.splice(targetIdx, 0, item);
    setStats(copy);
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  // For panels (stats area and policies area) simple reorder
  const [panels, setPanels] = useState<string[]>(['stats', 'policies']);
  const onPanelDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('panel', id);
  };
  const onPanelDrop = (e: React.DragEvent, target: string) => {
    e.preventDefault();
    const src = e.dataTransfer.getData('panel');
    if (!src || src === target) return;
    const copy = [...panels];
    const from = copy.indexOf(src);
    const to = copy.indexOf(target);
    copy.splice(from, 1);
    copy.splice(to, 0, src);
    setPanels(copy);
  };

  const renderStats = useCallback(() => {
    return (
      <section
        className="panel stats-panel"
        draggable
        onDragStart={(e) => onPanelDragStart(e, 'stats')}
        onDragOver={allowDrop}
        onDrop={(e) => onPanelDrop(e, 'stats')}
      >
        <h3 className="panel-title">Overview</h3>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div
              key={s.label}
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={allowDrop}
              onDrop={(e) => onDropStat(e, i)}
              draggable
            >
              <StatCard stat={s} />
            </div>
          ))}
        </div>
        {pieData && (
          <div className="chart-wrap">
            <Doughnut
              data={pieData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                cutout: '60%',
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#d8e6ff' } },
                },
              }}
            />
          </div>
        )}
      </section>
    );
  }, [stats, pieData]);

  const renderPolicies = useCallback(() => {
    return (
      <section
        className="panel policies-panel"
        draggable
        onDragStart={(e) => onPanelDragStart(e, 'policies')}
        onDragOver={allowDrop}
        onDrop={(e) => onPanelDrop(e, 'policies')}
      >
        <h3 className="panel-title">Policy Catalog</h3>
        <div className="policies-table">
          <div className="table-head">
            <div>Policy Type</div>
            <div>Description</div>
            <div>Example Violation</div>
          </div>
          <div className="table-body">
            {policies.map((p) => (
              <div className="table-row" key={p.type}>
                <div className="col-type">{p.type}</div>
                <div className="col-desc">{p.description}</div>
                <div className="col-example">{p.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }, [policies]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="logo">
            <img src={logo} alt="Lynx" />
            <span>Reviews</span>
          </div>

          <nav className="menu">
            <div className="menu-item active">Dashboard</div>
            <div className="menu-item">Tab2</div>
            <div className="menu-item">Tab3 <span className="badge">999</span></div>
            <div className="menu-item">Tab4 <span className="badge">999</span></div>
            <div className="menu-item">Tab5 <span className="badge">999</span></div>
            <div className="menu-item">Tab6 <span className="badge">999</span></div>
            <div className="menu-item">Tab7 <span className="badge">999</span></div>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user">
            <img src="/src/assets/react-logo.png" alt="avatar" />
            <div className="user-info">
              <div className="user-name">Joe Ma</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="main-header">
          <h2>Dashboard</h2>
          <div className="header-right">
            <input className="search" placeholder="Search" />
            <div className="date">Monday, July 2</div>
          </div>
        </header>

        <section className="stats-row">
          {stats.map((s) => (
            <div className="stat-card white" key={s.label}>
              <div className="stat-label muted">{s.label}</div>
              <div className="stat-value dark">{s.value}</div>
              {s.delta && <div className="stat-delta small">{s.delta}</div>}
            </div>
          ))}
        </section>

        <div className="content-grid">
          <div className="left-col">
            <div className="panel card">
              <div className="panel-title">Policy Catalog</div>
              <div className="policy-table">
                <div className="table-head">
                  <div>Policy Type</div>
                  <div>Description</div>
                  <div>Example Violation</div>
                </div>
                <div className="table-body">
                  {policies.map((p) => (
                    <div className="table-row" key={p.type}>
                      <div className="col-type">{p.type}</div>
                      <div className="col-desc">{p.description}</div>
                      <div className="col-example">{p.example}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="right-col">
            <div className="panel card">
              <div className="panel-title">Policy Types</div>
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="chart-wrap">
                {pieData ? (
                  <Doughnut
                    data={pieData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      cutout: '60%',
                      plugins: { legend: { position: 'bottom', labels: { color: '#021026' } } },
                    }}
                  />
                ) : (
                  <div className="chart-placeholder">Loading chart...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="main-footer">Team Win One • {new Date().getFullYear()}</footer>
      </main>
    </div>
  );
};

export default Dashboard;
