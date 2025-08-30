import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import logo from '../assets/lynx-logo.png';
import avatar from '../assets/react-logo.png';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import ChatAssistant from './ChatAssistant';
import { fetchPolicies } from '../mockApi';

Chart.register(ArcElement, Tooltip, Legend);


type Policy = {
  type: string;
  description: string;
  example: string;
};

type Review = {
  id: number;
  timeOfReview: string;
  reviewContent: string;
  justification: string;
  violationType: string;
  metadata?: string;
};


const Dashboard: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const reviewsRef = useRef<Review[]>([]);
  const [pieData, setPieData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localDate, setlocalDate] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [fileInputValue, setFileInputValue] = useState<string>('');
  const [shopMetadata, setShopMetadata] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentItem: string }>({ current: 0, total: 0, currentItem: '' });
  const [batchResults, setBatchResults] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const generatePieDataFromReviews = (reviewData: Review[]) => {
    const counts = {
      Compliant: 0,
      Advertisement: 0,
      Irrelevant: 0,
      Rant: 0,
      Other: 0
    };

    reviewData.forEach(review => {
      const violationType = review.violationType;
      if (violationType === 'Compliant') {
        counts.Compliant++;
      } else if (violationType === 'advertisement') {
        counts.Advertisement++;
      } else if (violationType === 'irrelevant') {
        counts.Irrelevant++;
      } else if (violationType === 'rant') {
        counts.Rant++;
      } else {
        counts.Other++;
      }
    });

    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColor: string[] = [];
    const colorMap = {
      Compliant: '#2ecc71',
      Advertisement: '#f1c40f',
      Irrelevant: '#e74c3c',
      Rant: '#e67e22',
      Other: '#9b59b6'
    };

    Object.entries(counts).forEach(([key, value]) => {
      if (value > 0) {
        labels.push(key);
        data.push(value);
        backgroundColor.push(colorMap[key as keyof typeof colorMap]);
      }
    });

    if (labels.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#bdc3c7'],
          },
        ],
      };
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
        },
      ],
    };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const p = await fetchPolicies();
      if (!mounted) return;
      setPolicies(p);
      const savedReviews = localStorage.getItem('reviewHistory');
      if (savedReviews) {
        const parsedReviews = JSON.parse(savedReviews);
        setReviews(parsedReviews);
        reviewsRef.current = parsedReviews;
        setPieData(generatePieDataFromReviews(parsedReviews));
      } else {
        setPieData(generatePieDataFromReviews([]));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    reviewsRef.current = reviews;
    setPieData(generatePieDataFromReviews(reviews));
  }, [reviews]);

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

  const handleFileUpload = (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setUploadedFile(file);
      setFileInputValue(file.name);
      processCsvFile(file);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const processCsvFile = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      alert('CSV file must contain at least a header row and one data row');
      return;
    }

    const reviews = lines.slice(1).map(line => {
      const columns = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i-1] === ',')) {
          inQuotes = true;
        } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
          inQuotes = false;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim());
      
      return columns[0] ? columns[0].replace(/^"(.*)"$/, '$1') : '';
    }).filter(review => review.length > 0);

    if (reviews.length === 0) {
      alert('No valid reviews found in CSV file. Please check the format.');
      return;
    }

    await processBatchReviews(reviews);
  };

  const processBatchReviews = async (reviews: string[]) => {
    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: reviews.length, currentItem: '' });
    setPredictionResult(null);
    
    const startTime = Date.now();
    const categoryCounts = { compliant: 0, violation: 0, errors: 0 };
    let processedCount = 0;
    let saveCount = 0;

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      
      setBatchProgress({ 
        current: i + 1, 
        total: reviews.length, 
        currentItem: review.length > 50 ? review.substring(0, 50) + '...' : review 
      });

      const result = await callPredictAPI(review, true, review);
      
      let savedResult = null;
      
      if (result) {
        savedResult = saveToReviewHistory(result, review);
        processedCount++;
        saveCount++;
        const violationType = result.label === 'valid' ? 'Compliant' : result.label;
        if (violationType === 'Compliant') {
          categoryCounts.compliant++;
        } else if (result.label === 'error') {
          categoryCounts.errors++;
        } else {
          categoryCounts.violation++;
        }
      } else {
        const errorResult = {
          label: 'error',
          model_outputs: [{
            model: 'system',
            rationale: 'Failed to process due to API error'
          }]
        };
        savedResult = saveToReviewHistory(errorResult, review);
        processedCount++;
        saveCount++;
        categoryCounts.errors++;
      }

      console.log(`� After processing review ${i + 1}: ${reviewsRef.current.length} reviews in memory`);
      console.log(`�💾 Review ${savedResult?.id} saved. Save count: ${saveCount}/${reviews.length}, Total reviews: ${reviewsRef.current.length}`);

      await new Promise(resolve => setTimeout(resolve, 500));
      
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(void 0);
        }, 100);
      });
    }

    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;

    setBatchResults({
      totalProcessed: processedCount,
      timeTaken: timeTaken.toFixed(2),
      categoryCounts,
      processedAt: new Date().toLocaleString()
    });

    setReviews([...reviewsRef.current]);
    setIsBatchProcessing(false);
    setBatchProgress({ current: 0, total: 0, currentItem: '' });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileInputValue(e.target.value);
  };

  const callPredictAPI = async (text: string, isBatchMode: boolean = false, reviewText?: string, metadata?: string) => {
    if (!text.trim()) return null;
    
    if (!isBatchMode) {
      setBatchResults(null);
      setIsLoading(true);
    }
    
    try {
      const requestBody: any = { text: text };
      if (metadata && metadata.trim()) {
        requestBody.shop_info = metadata;
      }
      
      console.log(JSON.stringify(requestBody));
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (!isBatchMode) {
          setPredictionResult(result);
          saveToReviewHistory(result, reviewText, metadata);
        }
        
        return result;
      } else {
        console.error('API call failed:', response.statusText);
        if (!isBatchMode) {
          alert('API call failed. Please check if the server is running on localhost:4000');
        }
        return null;
      }
    } catch (error) {
      console.error('Error calling predict API:', error);
      if (!isBatchMode) {
        alert('Failed to connect to API server. Please ensure the Flask server is running on localhost:4000');
      }
      return null;
    } finally {
      if (!isBatchMode) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      callPredictAPI(fileInputValue, false, undefined, shopMetadata);
    }
  };

  const saveToReviewHistory = (predictionData: any, reviewText?: string, metadata?: string) => {
    const newReview: Review = {
      id: Date.now() + Math.random(),
      timeOfReview: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      reviewContent: reviewText || fileInputValue,
      justification: predictionData.model_outputs && predictionData.model_outputs.length > 0 
        ? predictionData.model_outputs[0].rationale 
        : 'AI classification based on ensemble model consensus',
      violationType: predictionData.label === 'valid' ? 'Compliant' : predictionData.label
    };

    if (metadata && metadata.trim()) {
      newReview.metadata = metadata;
    }

    const updatedReviews = [newReview, ...reviewsRef.current];
    reviewsRef.current = updatedReviews;
    
    localStorage.setItem('reviewHistory', JSON.stringify(updatedReviews));
    
    setReviews(updatedReviews);
    
    setRefreshTrigger(prev => prev + 1);
    
    return newReview;
  };

  const clearReviewHistory = () => {
    if (window.confirm('Are you sure you want to clear all review history? This action cannot be undone.')) {
      setReviews([]);
      localStorage.removeItem('reviewHistory');
    }
  };

  const downloadReviewHistoryCSV = () => {
    if (reviews.length === 0) return;

    const headers = ['Time of Review', 'Content', 'Justification', 'Violation Type', 'Shop Metadata'];
    
    const csvContent = [
      headers.join(','),
      ...reviews.map(review => [
        `"${review.timeOfReview}"`,
        `"${review.reviewContent.replace(/"/g, '""')}"`,
        `"${review.justification.replace(/"/g, '""')}"`,
        `"${review.violationType}"`,
        `"${review.metadata || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `review_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


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

        <div className="file-upload-section">
          <div className="panel card">
            <div className="panel-title">Upload CSV File</div>
            <div className="upload-area">
              <div className="upload-input-row">
                <input
                  type="text"
                  className="manual-text-input"
                  placeholder="Enter review text to classify (Press Enter or click Analyze)"
                  value={fileInputValue}
                  onChange={handleTextInputChange}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <input
                  type="text"
                  className="shop-metadata-input"
                  placeholder="Shop Metadata (optional)"
                  value={shopMetadata}
                  onChange={(e) => setShopMetadata(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  className="analyze-btn"
                  onClick={() => callPredictAPI(fileInputValue, false, undefined, shopMetadata)}
                  disabled={isLoading || !fileInputValue.trim()}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
              <div 
                className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="drop-zone-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>Drop your CSV file here</p>
                  <span className="file-types">Supported format: .csv</span>
                </div>
              </div>
              {uploadedFile && (
                <div className="uploaded-file-info">
                  <span className="file-name">✓ {uploadedFile.name}</span>
                  <span className="file-size">({(uploadedFile.size / 1024).toFixed(2)} KB)</span>
                </div>
              )}
              
              {isBatchProcessing && (
                <div className="batch-processing">
                  <div className="batch-header">
                    <h4>Processing CSV File...</h4>
                    <div className="batch-progress-info">
                      Processing {batchProgress.current} of {batchProgress.total} items
                    </div>
                  </div>
                  
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="progress-percentage">
                      {Math.round((batchProgress.current / batchProgress.total) * 100)}%
                    </div>
                  </div>
                  
                  <div className="current-item">
                    <strong>Currently processing:</strong> {batchProgress.currentItem}
                  </div>
                </div>
              )}

              {batchResults && (
                <div className="batch-results">
                  <div className="result-header">
                    <h4>Batch Processing Complete</h4>
                    <div className="result-status-info">
                      <div className="auto-saved-indicator">✓ All results auto-saved to history</div>
                      <div className="result-timestamp">
                        {batchResults.processedAt}
                      </div>
                    </div>
                  </div>
                  
                  <div className="batch-summary">
                    <div className="summary-item">
                      <div className="summary-label">Total Items Processed</div>
                      <div className="summary-value">{batchResults.totalProcessed}</div>
                    </div>
                    
                    <div className="summary-item">
                      <div className="summary-label">Time Taken</div>
                      <div className="summary-value">{batchResults.timeTaken}s</div>
                    </div>
                    
                    <div className="summary-categories">
                      <div className="summary-category compliant">
                        <div className="category-icon">✓</div>
                        <div className="category-info">
                          <div className="category-label">Compliant</div>
                          <div className="category-count">{batchResults.categoryCounts.compliant}</div>
                        </div>
                      </div>
                      
                      <div className="summary-category violation">
                        <div className="category-icon">⚠</div>
                        <div className="category-info">
                          <div className="category-label">Violations</div>
                          <div className="category-count">{batchResults.categoryCounts.violation}</div>
                        </div>
                      </div>

                      {batchResults.categoryCounts.errors > 0 && (
                        <div className="summary-category error">
                          <div className="category-icon">✕</div>
                          <div className="category-info">
                            <div className="category-label">Errors</div>
                            <div className="category-count">{batchResults.categoryCounts.errors}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="result-actions">
                    <button 
                      className="action-btn secondary"
                      onClick={() => {
                        setBatchResults(null);
                        setUploadedFile(null);
                        setFileInputValue('');
                        setShopMetadata('');
                      }}
                    >
                      Clear Results
                    </button>
                  </div>
                </div>
              )}

              {predictionResult && !batchResults && (
                <div className="prediction-result">
                  <div className="result-header">
                    <h4>Classification Result</h4>
                    <div className="result-status-info">
                      <div className="auto-saved-indicator">✓ Auto-saved to history</div>
                      <div className="result-timestamp">
                        {new Date().toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="result-main">
                    <div className="result-status">
                      <div className={`status-indicator ${predictionResult.label === 'valid' ? 'compliant' : 'violation'}`}>
                        <div className="status-icon">
                          {predictionResult.label === 'valid' ? '✓' : '⚠'}
                        </div>
                        <div className="status-text">
                          <span className="status-label">{predictionResult.label === 'valid' ? 'Compliant' : predictionResult.label}</span>
                          {predictionResult.votes && (
                            <span className="confidence-score">
                              Consensus: {Math.max(...(Object.values(predictionResult.votes) as number[]))} / {(Object.values(predictionResult.votes) as number[]).reduce((a, b) => a + b, 0)} models
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="result-details">
                      <div className="analyzed-text">
                        <h5>Analyzed Text:</h5>
                        <div className="text-content">{fileInputValue}</div>
                      </div>
                      
                      {predictionResult.model_outputs && predictionResult.model_outputs.length > 0 && (
                        <div className="model-outputs">
                          <h5>Model Analysis:</h5>
                          <div className="models-grid">
                            {predictionResult.model_outputs.map((output: any, index: number) => (
                              <div key={index} className={`model-card ${output.label === predictionResult.label ? 'consensus' : 'dissenting'}`}>
                                <div className="model-header">
                                  <span className="model-name">{output.model}</span>
                                  <span className={`model-label ${output.label === 'valid' ? 'valid' : 'invalid'}`}>
                                    {output.label === 'valid' ? 'Compliant' : output.label}
                                  </span>
                                </div>
                                <div className="model-rationale">
                                  {output.rationale}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="result-actions">
                    <button 
                      className="action-btn secondary"
                      onClick={() => {
                        setPredictionResult(null);
                        setFileInputValue('');
                        setShopMetadata('');
                      }}
                    >
                      Clear Result
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
            <div className="panel-title-row">
              <div className="panel-title">Review History</div>
              {reviews.length > 0 && (
                <div className="history-actions">
                  <button 
                    className="download-csv-btn"
                    onClick={downloadReviewHistoryCSV}
                    title="Download review history as CSV"
                  >
                    Download CSV
                  </button>
                  <button 
                    className="clear-history-btn"
                    onClick={clearReviewHistory}
                    title="Clear all review history"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
            {reviews.length === 0 ? (
              <div className="empty-state">
                <p>No reviews analyzed yet. Use the classification tool above to analyze reviews and they will appear here.</p>
              </div>
            ) : (
              <div className="reviews-table">
                <div className="reviews-table-head">
                  <div>Time of Review</div>
                  <div>Content</div>
                  <div>Justification</div>
                  <div>Violation Type</div>
                  <div>Shop Metadata</div>
                </div>
                <div className="reviews-table-body">
                  {reviews.map((review) => (
                    <div className="reviews-table-row" key={review.id}>
                      <div className="col-time">{review.timeOfReview}</div>
                      <div className="col-content">{review.reviewContent}</div>
                      <div className="col-justification">{review.justification}</div>
                      <div className={`col-violation ${review.violationType === 'Compliant' ? 'compliant' : 'violation'}`}>
                        {review.violationType}
                      </div>
                      <div className="col-metadata">{review.metadata || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="main-footer">Team Win One • {new Date().getFullYear()}</footer>
      </main>
  <ChatAssistant />
    </div>
  );
};

export default Dashboard;
