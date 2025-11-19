import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const API_BASE = 'http://localhost:3001';

const FortyGameReportPage = () => {
  const [platform, setPlatform] = useState('auto');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [scouting, setScouting] = useState(null);
  const [timeClass, setTimeClass] = useState('');
  const [importedCount, setImportedCount] = useState(null);
  const [processingCount, setProcessingCount] = useState(0);
  const totalMoves = summary?.total || 0;
  const pct = (n) => {
    if (!totalMoves) return 0;
    return Math.round((n / totalMoves) * 1000) / 10; // one decimal
  };

  const formatNum = (v, d = 2) => (v ?? 0).toFixed(d);
  
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

      const response = await fetch(`${API_BASE}/api/pdf/report?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        }
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

      // Import last 100 games
      const platformParam = platform === 'auto' ? 'chesscom' : platform;
      const importRes = await fetch(`${API_BASE}/api/games/import?username=${encodeURIComponent(username)}&platform=${encodeURIComponent(platformParam)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        }
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
      const reportRes = await fetch(`${API_BASE}/api/games/report/40?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}&_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        }
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
          const poll = await fetch(`${API_BASE}/api/games/report/40?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}&_t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-auth-token': token }
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
      const scoutRes = await fetch(`${API_BASE}/api/games/report/scouting?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}&_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        }
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

      const response = await fetch(`${API_BASE}/api/pdf/report?username=${encodeURIComponent(username)}&timeClass=${encodeURIComponent(timeClass)}&platform=${encodeURIComponent(platform)}&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto py-10 px-4">
              <h1 className="text-4xl font-extrabold mb-6 text-center tracking-tight">20-Game Report</h1>
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-100">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Platform</label>
          <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400" value={platform} onChange={e => setPlatform(e.target.value)}>
            <option value="auto">Auto (try both)</option>
            <option value="chesscom">Chess.com</option>
            <option value="lichess">Lichess</option>
          </select>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-sm text-gray-600 mb-1">Username</label>
          <input className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400" placeholder="e.g. hikaru" value={username} onChange={e => setUsername(e.target.value)} />
          <div>
            <label className="block text-sm text-gray-600 mb-1">Time class</label>
            <select className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-400" value={timeClass} onChange={e => setTimeClass(e.target.value)}>
              <option value="">All</option>
              <option value="bullet">Bullet</option>
              <option value="blitz">Blitz</option>
              <option value="rapid">Rapid</option>
              <option value="classical">Classical</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="flex gap-3">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
              onClick={runReport}
              disabled={loading || !username.trim()}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              onClick={handleDownloadPDF}
              disabled={loading || !username.trim() || (!summary && !metrics)}
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
          {username && (
            <span className="ml-3 inline-flex items-center gap-2 text-xs text-slate-600">
              <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">{platform}</span>
              <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">{username}</span>
              {timeClass && <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">{timeClass}</span>}
            </span>
          )}
          {error && <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}
          {warning && <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">{warning}</div>}
          {processingCount > 0 && !error && (
            <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">Analyzing {processingCount} game(s)… this will update automatically.</div>
          )}
          {importedCount !== null && importedCount >= 0 && !error && (
            <div className="mt-2 text-xs text-slate-500">Imported: {importedCount} game(s)</div>
          )}
        </div>
      </div>

      {(summary || metrics) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Move Quality Summary</h2>
              <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {timeClass ? `${timeClass.charAt(0).toUpperCase() + timeClass.slice(1)}` : 'All time controls'}
              </div>
            </div>
            <div className="space-y-3">
              {[{k:'best',label:'Best',color:'bg-emerald-500'},
                {k:'good',label:'Good',color:'bg-blue-500'},
                {k:'inaccuracy',label:'Inaccuracy',color:'bg-amber-500'},
                {k:'mistake',label:'Mistake',color:'bg-orange-600'},
                {k:'blunder',label:'Blunder',color:'bg-red-600'}].map(row=> (
                <div key={row.k}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{row.label}</span>
                    <span className="text-slate-500">{summary?.[row.k] ?? 0} ({pct(summary?.[row.k]||0)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded">
                    <div className={`${row.color} h-2 rounded`} style={{ width: `${pct(summary?.[row.k]||0)}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{summary?.total ?? 0}</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 border border-slate-100">
            <h2 className="text-lg font-semibold mb-3">Key Metrics (approx)</h2>
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <tbody>
                <tr><td className="border px-2 py-1">Opening score (avg cp after move 12)</td><td className="border px-2 py-1 text-right">{(((metrics?.openingScoreCp ?? 0) / 100)).toFixed(2)}</td></tr>
                <tr><td className="border px-2 py-1">Blunders per game (avg)</td><td className="border px-2 py-1 text-right">{(((scouting?.blundersPerGame) ?? (metrics?.tacticsBlundersPerGame) ?? 0).toFixed(2))}</td></tr>
                <tr><td className="border px-2 py-1">Endgame cp-loss per move (avg)</td><td className="border px-2 py-1 text-right">{(((metrics?.endgameCpLossPerMove ?? 0) / 100)).toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scouting && (
        <div className="mt-6 grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
            <h2 className="text-lg font-semibold mb-3">Scouting Report (Aimchess-style)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50 rounded"><div className="text-xs text-gray-600">Best move rate</div><div className="text-2xl font-bold">{(scouting.bestMoveRate ?? 0).toFixed(1)}%</div></div>
              <div className="p-3 bg-red-50 rounded"><div className="text-xs text-gray-600">Blunders /100</div><div className="text-2xl font-bold">{(scouting.blundersPer100 ?? 0).toFixed(1)}</div></div>
              <div className="p-3 bg-rose-50 rounded"><div className="text-xs text-gray-600">Blunders /game</div><div className="text-2xl font-bold">{(scouting.blundersPerGame ?? 0).toFixed(2)}</div></div>
              <div className="p-3 bg-emerald-50 rounded"><div className="text-xs text-gray-600">ACPL (pawns)</div><div className="text-2xl font-bold">{(scouting.acpl ?? 0).toFixed(3)}</div></div>
              <div className="p-3 bg-yellow-50 rounded"><div className="text-xs text-gray-600">Opening score (pawns)</div><div className="text-2xl font-bold">{(scouting.openingScore ?? 0).toFixed(2)}</div></div>
              <div className="p-3 bg-purple-50 rounded"><div className="text-xs text-gray-600">Endgame loss/ move (pawns)</div><div className="text-2xl font-bold">{(scouting.endgameLossPerMove ?? 0).toFixed(3)}</div></div>
              <div className="p-3 bg-teal-50 rounded"><div className="text-xs text-gray-600">Advantage cap.</div><div className="text-2xl font-bold">{(scouting.advantageCapitalization ?? 0).toFixed(1)}%</div></div>
              <div className="p-3 bg-indigo-50 rounded"><div className="text-xs text-gray-600">Resourcefulness</div><div className="text-2xl font-bold">{(scouting.resourcefulness ?? 0).toFixed(1)}%</div></div>
            </div>
            <div className="text-xs text-gray-500 mt-2">Definitions: Blunders/100 counts only your moves; ACPL is average centipawn loss per move in pawns; Opening score is from your side after move 12; Advantage/Resourcefulness calculated from move quality.</div>
            {/* Insights */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="text-sm font-semibold text-emerald-700 mb-2">Strengths</div>
                <ul className="text-sm list-disc pl-5 text-emerald-800">
                  {computeInsights(scouting).strengths.length ? computeInsights(scouting).strengths.map((x,i)=>(<li key={i}>{x}</li>)) : <li>No standout strengths yet — keep training.</li>}
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-orange-50 border border-orange-100">
                <div className="text-sm font-semibold text-orange-700 mb-2">Focus next</div>
                <ul className="text-sm list-disc pl-5 text-orange-800">
                  {computeInsights(scouting).focus.length ? computeInsights(scouting).focus.map((x,i)=>(<li key={i}>{x}</li>)) : <li>Great balance — refine openings and endgames.</li>}
                </ul>
              </div>
            </div>
          </div>
          
          {/* High Performance Openings */}
          {highOpenings && highOpenings.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-6 border border-slate-100">
              <h3 className="text-md font-semibold mb-2 text-green-700">🚀 Best Performing Openings</h3>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead>
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
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead>
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
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead>
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
                    <tr key={idx}>
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

