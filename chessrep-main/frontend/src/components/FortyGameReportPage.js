import React, { useState, useEffect } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiUrl, getAuthHeaders } from '../config/api';

const FortyGameReportPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [platform, setPlatform] = useState('chesscom');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [scouting, setScouting] = useState(null);
  const [timeClass, setTimeClass] = useState('blitz');
  const [importedCount, setImportedCount] = useState(null);
  const [processingCount, setProcessingCount] = useState(0);
  const [savedReports, setSavedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const totalMoves = summary?.total || 0;
  const pct = (n) => {
    if (!totalMoves) return 0;
    return Math.round((n / totalMoves) * 1000) / 10; // one decimal
  };

  const formatNum = (v, d = 2) => (v ?? 0).toFixed(d);
  
  // Load a saved report
  const loadSavedReport = async (reportId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await fetch(getApiUrl(`games/reports/${reportId}`), {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          setError(`Report not found. You can generate a new report below.`);
        } else {
          throw new Error(errorData.message || 'Failed to load report');
        }
        return;
      }
      
      const report = await response.json();
      
      // Set the report data
      if (report.reportData) {
        if (report.reportData.summary) setSummary(report.reportData.summary);
        if (report.reportData.metrics) setMetrics(report.reportData.metrics);
        if (report.reportData.scouting) setScouting(report.reportData.scouting);
        
        // Set username and platform from report
        setUsername(report.username || '');
        setPlatform(report.platform === 'auto' ? 'chesscom' : (report.platform || 'chesscom'));
        setTimeClass(report.timeClass || 'blitz');
      }
      
      // Scroll to results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setError(`Failed to load report: ${error.message}. You can generate a new report below.`);
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load report if ID is in URL
  useEffect(() => {
    if (id) {
      // Only try to load as saved report if it looks like a valid MongoDB ObjectId (24 hex characters)
      // This prevents trying to load "40" as a report ID when the route is /report/40
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      if (isValidObjectId) {
        // Load the report with the ID from the URL
        loadSavedReport(id);
      }
      // If id is not a valid ObjectId (like "40"), don't try to load it as a saved report
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch saved reports on mount
  useEffect(() => {
    const fetchSavedReports = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        setLoadingReports(true);
        const response = await fetch(getApiUrl('games/reports'), {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setSavedReports(data.reports || []);
        }
      } catch (error) {
        console.error('Error fetching saved reports:', error);
      } finally {
        setLoadingReports(false);
      }
    };
    
    fetchSavedReports();
  }, []);

  // Clear cached data when filters change
  useEffect(() => {
    // Clear all cached data when timeClass, platform, or username changes
    setSummary(null);
    setMetrics(null);
    setScouting(null);
    setError('');
    setWarning('');
    setImportedCount(null);
    setProcessingCount(0);
  }, [timeClass, platform, username]);

  // Refresh saved reports after generating a new report
  useEffect(() => {
    if (scouting && !loading) {
      // Report was just generated, refresh the list
      const fetchSavedReports = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          const response = await fetch(getApiUrl('games/reports'), {
            headers: getAuthHeaders()
          });
          if (response.ok) {
            const data = await response.json();
            setSavedReports(data.reports || []);
          }
        } catch (error) {
          console.error('Error fetching saved reports:', error);
        }
      };
      
      // Add a small delay to ensure backend has saved the report
      const timer = setTimeout(() => {
        fetchSavedReports();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [scouting, loading]);
  
  // Opening helpers to normalize backend data and avoid undefined.toFixed errors
  const getOpenings = (s) => {
    const src = s?.openings || [];
    return src.map(o => ({
      eco: o.eco || 'NA',
      name: o.name || 'Unknown',
      games: o.games || 0,
      scorePct: typeof o.scorePct === 'number' ? o.scorePct : 0,
      avgCpAfter12: typeof o.avgCpAfter12 === 'number' ? o.avgCpAfter12 : (typeof o.avgScore === 'number' ? o.avgScore : 0),
      gameUrls: o.gameUrls || o.links || []
    }));
  };
  const derivedHighOpenings = (s) => getOpenings(s).sort((a,b)=> (b.avgCpAfter12 - a.avgCpAfter12)).slice(0,5);
  const derivedLowOpenings  = (s) => getOpenings(s).sort((a,b)=> (a.avgCpAfter12 - b.avgCpAfter12)).slice(0,5);
  const computeInsights = (s) => {
    if (!s) return { strengths: [], focus: [] };
    const strengths = [];
    const focus = [];
    // Strengths
    if ((s.bestMoveRate ?? 0) >= 55) strengths.push('Solid accuracy over 55% best moves');
    if ((s.advantageCapitalization ?? 0) >= 60) strengths.push('Converts advantages reliably');
    if ((s.resourcefulness ?? 0) >= 55) strengths.push('Defends worse positions well');
    if ((s.endgameLossPerMove ?? 0) <= 0.015) strengths.push('Precise in endgames');
    // Focus areas
    if ((s.blundersPer100 ?? 0) >= 12) focus.push('Reduce blunders: aim for < 10 per 100 moves');
    if ((s.acpl ?? 0) >= 0.07) focus.push('Lower ACPL: target < 0.07 pawns per move');
    if ((s.openingScore ?? 0) <= -0.10) focus.push('Opening score is negative: review early game');
    if ((s.advantageCapitalization ?? 0) < 40) focus.push('Improve advantage capitalization');
    if ((s.resourcefulness ?? 0) < 40) focus.push('Work on resourcefulness and defense');
    return { strengths, focus };
  };

  const downloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in.');
        return;
      }

      if (!username.trim()) {
        setError('Please enter a username first.');
        return;
      }

      const response = await fetch(getApiUrl(`pdf/report?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}`), {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chess-report-${username}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError(`Download failed: ${error.message}`);
    }
  };

  const runReport = async () => {
    setLoading(true);
    setError('');
    setSummary(null);
    setMetrics(null);
    setScouting(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      
      // Check usage limits for free users
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.userType !== 'premium') {
          try {
            const response = await fetch(getApiUrl('usage-limits/report-40'), {
              headers: getAuthHeaders()
            });
            
            if (response.ok) {
              const limitData = await response.json();
              if (!limitData.allowed) {
                setError('You\'ve already used your free report. Upgrade to premium for unlimited reports!');
                setLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error('Error checking usage limits:', error);
          }
        }
      }

      // Import last 100 games
      const importRes = await fetch(getApiUrl(`games/import?username=${encodeURIComponent(username)}&platform=${encodeURIComponent(platform)}`), {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!importRes.ok) {
        const d = await importRes.json().catch(() => ({}));
        const status = importRes.status;
        const msg = d.message || d.error || 'Failed to import games';
        const detail = d.detail ? ` (${d.detail})` : '';
        throw new Error(`${status}: ${msg}${detail}`);
      }
      const importedJson = await importRes.json().catch(()=>({}));
      if (typeof importedJson.imported === 'number') setImportedCount(importedJson.imported);
      // Don't stop if 0 games imported - they might already exist in database
      // The report endpoint will handle checking if games are available

              // Fetch 20-game report with cache-busting timestamp
      const timestamp = Date.now();
      const reportRes = await fetch(getApiUrl(`games/report/40?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}&_t=${timestamp}`), {
        headers: getAuthHeaders()
      });
      if (!reportRes.ok) {
        const d = await reportRes.json().catch(() => ({}));
        const status = reportRes.status;
        const msg = d.message || d.error || 'Failed to fetch report';
        const detail = d.detail ? ` (${d.detail})` : '';
        throw new Error(`${status}: ${msg}${detail}`);
      }
      const report = await reportRes.json();
      console.log('[Frontend] Report response:', JSON.stringify(report, null, 2));
      setSummary(report.summary || null);
      setMetrics(report.metrics || null);
      setProcessingCount(report.processing || 0);
      
      // Show warning if time control fallback occurred
      if (report.timeControlWarning) {
        setWarning(report.timeControlWarning);
        setError(''); // Clear any previous errors
      }
      if (report.processing && report.processing > 0) {
        // Poll up to 10x to let backend finish analyzing newly imported games
        for (let i = 0; i < 10; i++) {
          await new Promise(r => setTimeout(r, 1500));
          const poll = await fetch(getApiUrl(`games/report/40?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}&_t=${Date.now()}`), {
            headers: getAuthHeaders()
          });
          if (poll.ok) {
            const data = await poll.json();
            setSummary(data.summary || null);
            setMetrics(data.metrics || null);
            setProcessingCount(data.processing || 0);
            if (!data.processing) break;
          }
        }
      }

      // Fetch Scouting Report (Aimchess-style) with cache-busting
      const scoutRes = await fetch(getApiUrl(`games/report/scouting?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}&_t=${timestamp}`), {
        headers: getAuthHeaders()
      });
      if (!scoutRes.ok) {
        const d = await scoutRes.json().catch(() => ({}));
        const status = scoutRes.status;
        const msg = d.message || d.error || 'Failed to fetch scouting report';
        const detail = d.detail ? ` (${d.detail})` : '';
        throw new Error(`${status}: ${msg}${detail}`);
      }
      const scout = await scoutRes.json();
      console.log('[Frontend] Scouting response:', JSON.stringify(scout, null, 2));
      setScouting(scout);
      
      // Increment usage limit for free users after successful report generation
      const userDataForIncrement = localStorage.getItem('user');
      if (userDataForIncrement) {
        const user = JSON.parse(userDataForIncrement);
        if (user.userType !== 'premium') {
          try {
            await fetch(getApiUrl('usage-limits/report-40/increment'), {
              method: 'POST',
              headers: getAuthHeaders()
            });
          } catch (error) {
            console.error('Error incrementing usage limit:', error);
          }
        }
      }
    } catch (e) {
      setError(e.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!username) {
      setError('Please enter a username first');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in.');
        return;
      }

      const response = await fetch(getApiUrl(`pdf/report?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}&_t=${Date.now()}`), {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download PDF');
      }

      // Check content type to handle both PDF and HTML responses
      const contentType = response.headers.get('content-type');
      const blob = await response.blob();
      
      if (contentType && contentType.includes('text/html')) {
        // HTML fallback - open in new tab for user to save as PDF
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          // Fallback if popup blocked
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.download = `chess-report-${username}-${new Date().toISOString().split('T')[0]}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        
        alert('PDF generation service is temporarily unavailable.\n\nA printable report has opened in a new tab. You can save it as PDF by:\n1. Pressing Ctrl+P (or Cmd+P on Mac)\n2. Choosing "Save as PDF" as your printer\n3. Clicking Save');
        
      } else {
        // Normal PDF download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chess-report-${username}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      setError(`Download failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openingsAll = getOpenings(scouting);
  const highOpenings = (scouting?.highPerformanceOpenings?.length ? scouting.highPerformanceOpenings : derivedHighOpenings(scouting || {}));
  const lowOpenings  = (scouting?.lowPerformanceOpenings?.length ? scouting.lowPerformanceOpenings  : derivedLowOpenings(scouting || {}));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-black mb-4 tracking-tight">
            40-Game Analysis Report
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Get detailed insights into your chess performance with comprehensive analysis of your last 40 games
          </p>
        </div>

        {/* Saved Reports Section */}
        {savedReports.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-black mb-4">Saved Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedReports.slice(0, 6).map((report) => (
                <div 
                  key={report.id} 
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{report.username}</h3>
                      <p className="text-sm text-gray-600">
                        {report.platform === 'auto' ? 'Chess.com' : report.platform} • {report.timeClass || 'all'}
                      </p>
                      {report.playerRating && (
                        <p className="text-xs text-gray-500 mt-1">
                          Rating: {report.playerRating} {report.ratingRange && `(${report.ratingRange})`}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => loadSavedReport(report.id)}
                    disabled={loading}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Loading...' : 'View Report'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Form Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-12 border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Platform</label>
              <select 
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900" 
                value={platform} 
                onChange={e => setPlatform(e.target.value)}
              >
                <option value="chesscom">Chess.com</option>
                <option value="lichess">Lichess</option>
              </select>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400" 
                  placeholder="e.g. hikaru" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Time Control</label>
                <select 
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900" 
                  value={timeClass} 
                  onChange={e => setTimeClass(e.target.value)}
                >
                  <option value="bullet">Bullet</option>
                  <option value="blitz">Blitz</option>
                  <option value="rapid">Rapid</option>
                  <option value="classical">Classical</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  onClick={runReport}
                  disabled={loading || !username.trim()}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </button>
                <button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={() => navigate(`/report/peer-comparison?username=${username}&timeClass=${timeClass}&platform=${platform}`)}
                  disabled={loading || !username.trim() || (!summary && !metrics)}
                >
                  <BarChart3 size={18} />
                  More Metrics & Training Plan
                </button>
                <button
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleDownloadPDF}
                  disabled={loading || !username.trim() || (!summary && !metrics)}
                >
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
              
              {/* Status Tags */}
              {username && (
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium border border-blue-200">
                    {platform}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium border border-blue-200">
                    {username}
                  </span>
                  {timeClass && (
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium border border-green-200">
                      {timeClass}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Status Messages */}
            {error && (
              <div className="mt-4 p-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
            {warning && (
              <div className="mt-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium">
                {warning}
              </div>
            )}
            {processingCount > 0 && !error && (
              <div className="mt-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Analyzing {processingCount} game(s)… this will update automatically.
                </div>
              </div>
            )}
            {importedCount !== null && importedCount >= 0 && !error && (
              <div className="mt-3 text-sm text-gray-600 font-medium">
                ✅ Imported: {importedCount} game(s)
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {(summary || metrics) && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-black mb-2">Analysis Results</h2>
              <p className="text-gray-700">
                {timeClass ? `${timeClass.charAt(0).toUpperCase() + timeClass.slice(1)} games` : 'All time controls'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Move Quality Summary</h3>
                  <div className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                    {timeClass ? `${timeClass.charAt(0).toUpperCase() + timeClass.slice(1)}` : 'All time controls'}
                  </div>
                </div>
                <div className="space-y-4">
                  {[{k:'best',label:'Best',color:'bg-emerald-500',textColor:'text-emerald-700'},
                    {k:'good',label:'Good',color:'bg-blue-500',textColor:'text-blue-700'},
                    {k:'inaccuracy',label:'Inaccuracy',color:'bg-amber-500',textColor:'text-amber-700'},
                    {k:'mistake',label:'Mistake',color:'bg-orange-600',textColor:'text-orange-700'},
                    {k:'blunder',label:'Blunder',color:'bg-red-600',textColor:'text-red-700'}].map(row=> (
                    <div key={row.k} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800">{row.label}</span>
                        <span className="text-sm font-bold text-gray-600">{summary?.[row.k] ?? 0} ({pct(summary?.[row.k]||0)}%)</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className={`${row.color} h-3 rounded-full transition-all duration-500`} style={{ width: `${pct(summary?.[row.k]||0)}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                    <span className="text-lg font-bold text-gray-800">Total Moves</span>
                    <span className="text-lg font-bold text-gray-800">{summary?.total ?? 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Key Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium mb-1">Opening Score</div>
                    <div className="text-2xl font-bold text-blue-800">{(((metrics?.openingScoreCp ?? 0) / 100)).toFixed(2)}</div>
                    <div className="text-xs text-blue-600">Average centipawns after move 12</div>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                    <div className="text-sm text-red-600 font-medium mb-1">Blunders per Game</div>
                    <div className="text-2xl font-bold text-red-800">{(((scouting?.blundersPerGame) ?? (metrics?.tacticsBlundersPerGame) ?? 0).toFixed(2))}</div>
                    <div className="text-xs text-red-600">Average blunders per game</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">Endgame Precision</div>
                    <div className="text-2xl font-bold text-green-800">{(((metrics?.endgameCpLossPerMove ?? 0) / 100)).toFixed(2)}</div>
                    <div className="text-xs text-green-600">Centipawn loss per move in endgames</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scouting Report Section */}
        {scouting && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-black mb-2">Advanced Analysis</h2>
              <p className="text-gray-700">Detailed performance metrics and insights</p>
            </div>
            
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-gray-800 mb-8">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-2">Best Move Rate</div>
                  <div className="text-3xl font-bold text-blue-800">{(scouting.bestMoveRate ?? 0).toFixed(1)}%</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
                  <div className="text-sm text-red-600 font-medium mb-2">Blunders /100</div>
                  <div className="text-3xl font-bold text-red-800">{(scouting.blundersPer100 ?? 0).toFixed(1)}</div>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 border border-rose-200">
                  <div className="text-sm text-rose-600 font-medium mb-2">Blunders /game</div>
                  <div className="text-3xl font-bold text-rose-800">{(scouting.blundersPerGame ?? 0).toFixed(2)}</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                  <div className="text-sm text-emerald-600 font-medium mb-2">ACPL (pawns)</div>
                  <div className="text-3xl font-bold text-emerald-800">{(scouting.acpl ?? 0).toFixed(3)}</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
                  <div className="text-sm text-yellow-600 font-medium mb-2">Opening Score</div>
                  <div className="text-3xl font-bold text-yellow-800">{(scouting.openingScore ?? 0).toFixed(2)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-2">Endgame Loss</div>
                  <div className="text-3xl font-bold text-blue-800">{(scouting.endgameLossPerMove ?? 0).toFixed(3)}</div>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 border border-teal-200">
                  <div className="text-sm text-teal-600 font-medium mb-2">Advantage Cap.</div>
                  <div className="text-3xl font-bold text-teal-800">{(scouting.advantageCapitalization ?? 0).toFixed(1)}%</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
                  <div className="text-sm text-indigo-600 font-medium mb-2">Resourcefulness</div>
                  <div className="text-3xl font-bold text-indigo-800">{(scouting.resourcefulness ?? 0).toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-sm text-gray-600">
                  <strong>Definitions:</strong> Blunders/100 counts only your moves; ACPL is average centipawn loss per move in pawns; 
                  Opening score is from your side after move 12; Advantage/Resourcefulness calculated from move quality.
                </div>
              </div>
              
              {/* Insights */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                  <div className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💪</span>
                    Strengths
                  </div>
                  <ul className="space-y-2 text-emerald-800">
                    {computeInsights(scouting).strengths.length ? 
                      computeInsights(scouting).strengths.map((x,i)=>(<li key={i} className="flex items-start gap-2"><span className="text-emerald-600 mt-1">•</span><span>{x}</span></li>)) : 
                      <li className="flex items-start gap-2"><span className="text-emerald-600 mt-1">•</span><span>No standout strengths yet — keep training.</span></li>
                    }
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                  <div className="text-lg font-bold text-orange-700 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Focus Areas
                  </div>
                  <ul className="space-y-2 text-orange-800">
                    {computeInsights(scouting).focus.length ? 
                      computeInsights(scouting).focus.map((x,i)=>(<li key={i} className="flex items-start gap-2"><span className="text-orange-600 mt-1">•</span><span>{x}</span></li>)) : 
                      <li className="flex items-start gap-2"><span className="text-orange-600 mt-1">•</span><span>Great balance — refine openings and endgames.</span></li>
                    }
                  </ul>
                </div>
              </div>
            </div>
          
          {/* High Performance Openings */}
          {highOpenings && highOpenings.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
              <h3 className="text-md font-semibold mb-2 text-green-700">🚀 Best Performing Openings</h3>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm border rounded-lg overflow-hidden text-slate-800">
                  <thead className="bg-green-100 text-green-700">
                    <tr>
                      <th className="border px-2 py-1">ECO</th>
                      <th className="border px-2 py-1">Name</th>
                      <th className="border px-2 py-1">Games</th>
                      <th className="border px-2 py-1">Score%</th>
                      <th className="border px-2 py-1">CP@12</th>
                      <th className="border px-2 py-1">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highOpenings.map((o, idx) => (
                      <tr key={idx} className="bg-green-50">
                        <td className="border px-2 py-1">{o.eco}</td>
                        <td className="border px-2 py-1 truncate" title={o.name}>{o.name}</td>
                        <td className="border px-2 py-1 text-right">{o.games}</td>
                        <td className="border px-2 py-1 text-right text-green-600 font-semibold">{o.scorePct.toFixed(1)}%</td>
                        <td className="border px-2 py-1 text-right text-green-600">{o.avgCpAfter12.toFixed(2)}</td>
                        <td className="border px-2 py-1">
                          {o.gameUrls && o.gameUrls.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {o.gameUrls.map((url, urlIdx) => (
                                <a 
                                  key={urlIdx}
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-xs"
                                  title={`Game ${urlIdx + 1}`}
                                >
                                  G{urlIdx + 1}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Low Performance Openings */}
          {lowOpenings && lowOpenings.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
              <h3 className="text-md font-semibold mb-2 text-red-700">⚠️ Needs Improvement - Problematic Openings</h3>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm border rounded-lg overflow-hidden text-slate-800">
                  <thead className="bg-red-100 text-red-700">
                    <tr>
                      <th className="border px-2 py-1">ECO</th>
                      <th className="border px-2 py-1">Name</th>
                      <th className="border px-2 py-1">Games</th>
                      <th className="border px-2 py-1">Score%</th>
                      <th className="border px-2 py-1">CP@12</th>
                      <th className="border px-2 py-1">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowOpenings.map((o, idx) => (
                      <tr key={idx} className="bg-red-50">
                        <td className="border px-2 py-1">{o.eco}</td>
                        <td className="border px-2 py-1 truncate" title={o.name}>{o.name}</td>
                        <td className="border px-2 py-1 text-right">{o.games}</td>
                        <td className="border px-2 py-1 text-right text-red-600 font-semibold">{o.scorePct.toFixed(1)}%</td>
                        <td className="border px-2 py-1 text-right text-red-600">{o.avgCpAfter12.toFixed(2)}</td>
                        <td className="border px-2 py-1">
                          {o.gameUrls && o.gameUrls.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {o.gameUrls.map((url, urlIdx) => (
                                <a 
                                  key={urlIdx}
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-xs"
                                  title={`Game ${urlIdx + 1}`}
                                >
                                  G{urlIdx + 1}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Openings (for reference) */}
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <h3 className="text-md font-semibold mb-2">All Openings (by frequency)</h3>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm border rounded-lg overflow-hidden text-slate-800">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border px-2 py-1">ECO</th>
                    <th className="border px-2 py-1">Name</th>
                    <th className="border px-2 py-1">Games</th>
                    <th className="border px-2 py-1">Score%</th>
                    <th className="border px-2 py-1">CP@12</th>
                    <th className="border px-2 py-1">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {openingsAll.map((o, idx) => (
                    <tr key={idx} className={idx % 2 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="border px-2 py-1">{o.eco}</td>
                      <td className="border px-2 py-1 truncate" title={o.name}>{o.name}</td>
                      <td className="border px-2 py-1 text-right">{o.games}</td>
                      <td className="border px-2 py-1 text-right">{o.scorePct.toFixed(1)}</td>
                      <td className="border px-2 py-1 text-right">{o.avgCpAfter12.toFixed(2)}</td>
                      <td className="border px-2 py-1">
                        {o.gameUrls && o.gameUrls.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {o.gameUrls.map((url, urlIdx) => (
                              <a 
                                key={urlIdx}
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-xs"
                                title={`Game ${urlIdx + 1}`}
                              >
                                G{urlIdx + 1}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FortyGameReportPage;

