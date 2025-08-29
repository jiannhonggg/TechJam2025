import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import logo from '../assets/lynx-logo.png';
import avatar from '../assets/react-logo.png';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import ChatAssistant from './ChatAssistant';
import { fetchStats, fetchPolicies, fetchPieData, fetchReviews } from '../mockApi';

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

type Review = {
  id: number;
  timeOfReview: string;
  reviewerName: string;
  reviewContent: string;
  violationType: string;
};


const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pieData, setPieData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localDate, setlocalDate] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, p, pie, r] = await Promise.all([fetchStats(), fetchPolicies(), fetchPieData(), fetchReviews()]);
      if (!mounted) return;
      setStats(s);
      setPolicies(p);
      setPieData(pie);
      setReviews(r);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const updatelocal = () => {
      const now = new Date();
      const dateStr = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Singapore' }).format(now);
      const timeStr = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Singapore' }).format(now);
      setlocalDate(`${dateStr} • ${timeStr}`);
    };
    updatelocal();
    const id = setInterval(updatelocal, 60 * 1000);
    return () => clearInterval(id);
  }, []);


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
            {/* <div className="menu-item">Tab2</div>
            <div className="menu-item">Tab3 <span className="badge">999</span></div>
            <div className="menu-item">Tab4 <span className="badge">999</span></div>
            <div className="menu-item">Tab5 <span className="badge">999</span></div>
            <div className="menu-item">Tab6 <span className="badge">999</span></div>
            <div className="menu-item">Tab7 <span className="badge">999</span></div> */}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user">
            <img src={avatar} alt="avatar" />
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
            <input
              className="search"
              placeholder="Search policies"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="date">{localDate}</div>
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
                  {policies
                    .filter((p) => {
                      if (!searchTerm.trim()) return true;
                      const q = searchTerm.toLowerCase();
                      return (
                        p.type.toLowerCase().includes(q) ||
                        p.description.toLowerCase().includes(q) ||
                        p.example.toLowerCase().includes(q)
                      );
                    })
                    .map((p) => (
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
              <div className="chart-wrap">
                {pieData ? (
                  <Doughnut
                    data={pieData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      cutout: '60%',
                      plugins: {
                        legend: {
                          position: 'left',
                          align: 'start',
                          labels: {
                            color: '#021026',
                            boxWidth: 12,
                            padding: 12,
                            font: { size: 13 },
                          },
                        },
                      },
                      layout: { padding: { left: 8, right: 8 } },
                    }}
                  />
                ) : (
                  <div className="chart-placeholder">Loading chart...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="reviews-section">
          <div className="panel card">
            <div className="panel-title">Recent Reviews</div>
            <div className="reviews-table">
              <div className="reviews-table-head">
                <div>Time of Review</div>
                <div>Reviewer Name</div>
                <div>Review Content</div>
                <div>Violation Type</div>
              </div>
              <div className="reviews-table-body">
                {reviews.map((review) => (
                  <div className="reviews-table-row" key={review.id}>
                    <div className="col-time">{review.timeOfReview}</div>
                    <div className="col-reviewer">{review.reviewerName}</div>
                    <div className="col-content">{review.reviewContent}</div>
                    <div className={`col-violation ${review.violationType === 'Compliant' ? 'compliant' : 'violation'}`}>
                      {review.violationType}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="main-footer">Team Win One • {new Date().getFullYear()}</footer>
      </main>
  <ChatAssistant />
    </div>
  );
};

export default Dashboard;
