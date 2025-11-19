const fs = require('fs');
const path = require('path');

class SimplePDFGenerator {
  generateReport(data) {
    const { username, summary, metrics, scouting, games } = data;
    
    // Since Puppeteer is failing, we'll return a properly formatted HTML
    // that can be opened in browser and saved as PDF by the user
    const html = this.generateHTML(data);
    
    // Return HTML content that will be served with text/html content-type
    // so the user can manually save as PDF
    return Buffer.from(html, 'utf8');
  }

  generateHTML(data) {
    const { username, summary, metrics, scouting, games } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Chess Report - ${username}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 20px;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 15mm;
              font-size: 12px;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #7f8c8d;
            margin: 5px 0 0 0;
            font-size: 16px;
          }
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .section h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 22px;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .metric-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .metric-label {
            font-size: 14px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .move-breakdown {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .move-type {
            background: #e9ecef;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
          }
          .move-count {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
          }
          .move-label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
          }
          .best { background: #d4edda; }
          .good { background: #d1ecf1; }
          .inaccuracy { background: #fff3cd; }
          .mistake { background: #f8d7da; }
          .blunder { background: #f5c6cb; }
          .games-section {
            margin-top: 30px;
          }
          .game-item {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
            page-break-inside: avoid;
          }
          .game-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .game-players {
            font-weight: bold;
            color: #2c3e50;
          }
          .game-result {
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .win { background: #d4edda; color: #155724; }
          .loss { background: #f8d7da; color: #721c24; }
          .draw { background: #fff3cd; color: #856404; }
          .game-link {
            color: #3498db;
            text-decoration: none;
            font-size: 14px;
            word-break: break-all;
          }
          .game-link:hover {
            text-decoration: underline;
          }
          .game-details {
            font-size: 12px;
            color: #6c757d;
            margin-top: 5px;
          }
          .insights {
            background: #e8f4fd;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 5px 5px 0;
          }
          .insights h3 {
            margin-top: 0;
            color: #2c3e50;
          }
          .insights ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .insights li {
            margin-bottom: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 12px;
          }
          @media print {
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Chess Analysis Report</h1>
          <p>Player: ${username}</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>

        ${summary ? `
        <div class="section">
          <h2>Move Quality Summary</h2>
          <div class="move-breakdown" style="grid-template-columns: repeat(6, 1fr);">
            <div class="move-type best">
              <div class="move-count">${summary.best || 0}</div>
              <div class="move-label">Best</div>
            </div>
            <div class="move-type" style="background:#e6f7ff">
              <div class="move-count">${summary.excellent || 0}</div>
              <div class="move-label">Excellent</div>
            </div>
            <div class="move-type good">
              <div class="move-count">${summary.good || 0}</div>
              <div class="move-label">Good</div>
            </div>
            <div class="move-type inaccuracy">
              <div class="move-count">${summary.inaccuracy || 0}</div>
              <div class="move-label">Inaccuracy</div>
            </div>
            <div class="move-type mistake">
              <div class="move-count">${summary.mistake || 0}</div>
              <div class="move-label">Mistake</div>
            </div>
            <div class="move-type blunder">
              <div class="move-count">${summary.blunder || 0}</div>
              <div class="move-label">Blunder</div>
            </div>
          </div>
        </div>
        ` : ''}

                 ${scouting ? `
         <div class="section">
           <h2>Move Quality Summary - ${games ? games.length : 0} Games Analyzed</h2>
           <p style="color: #666; margin-bottom: 20px; font-style: italic;">
             This section analyzes your chess performance using Stockfish engine analysis, similar to AimChess reports. 
             Each metric helps identify strengths and areas for improvement.
           </p>
           <div class="metrics-grid">
             <div class="metric-card">
               <div class="metric-value">${(scouting.bestMoveRate || 0).toFixed(1)}%</div>
               <div class="metric-label">Best Move Rate</div>
               <div style="font-size: 11px; color: #888; margin-top: 5px;">Percentage of moves that match engine's top choice</div>
             </div>
             <div class="metric-card">
               <div class="metric-value">${(scouting.blundersPer100 || 0).toFixed(1)}</div>
               <div class="metric-label">Blunders /100</div>
               <div style="font-size: 11px; color: #888; margin-top: 5px;">Counts only your moves; major mistakes (-300cp or worse)</div>
             </div>
             <div class="metric-card">
               <div class="metric-value">${(scouting.blundersPerGame || 0).toFixed(2)}</div>
               <div class="metric-label">Blunders /game</div>
               <div style="font-size: 11px; color: #888; margin-top: 5px;">Average blunders per game you play</div>
             </div>
             <div class="metric-card">
               <div class="metric-value">${(scouting.acpl || 0).toFixed(0)}</div>
               <div class="metric-label">ACPL (pawns)</div>
               <div style="font-size: 11px; color: #888; margin-top: 5px;">Average centipawn loss per move in pawns</div>
             </div>
             <div class="metric-card">
               <div class="metric-value">${(scouting.openingScore || 0).toFixed(2)}</div>
               <div class="metric-label">Opening score (pawns)</div>
               <div style="font-size: 11px; color: #888; margin-top: 5px;">From your side after move 12</div>
             </div>
             <div class="metric-card">
               <div class="metric-value">${(scouting.endgameLossPerMove || 0).toFixed(3)}</div>
               <div class="metric-label">Endgame loss/ move (pawns)</div>
               <div style="font-size: 11px; color: #888; margin-top: 5px;">Average position loss in endgame phase</div>
             </div>
             <div class="metric-card">
               <div class="metric-value">${(scouting.advantageCapitalization || 0).toFixed(1)}%</div>
               <div class="metric-label">Advantage cap.</div>
               <div style="font-size: 11px; color: #888; margin-top: 5px;">How well you convert winning positions</div>
             </div>
             <div class="metric-card">
               <div class="metric-value">${(scouting.resourcefulness || 0).toFixed(1)}%</div>
               <div class="metric-label">Resourcefulness</div>
               <div style="font-size: 11px; color: #888; margin-top: 5px;">Calculated from move quality and defense</div>
             </div>
           </div>

           <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #3498db;">
             <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Definitions:</h4>
             <p style="margin: 5px 0; font-size: 13px;"><strong>Blunders/100:</strong> counts only your moves; ACPL is average centipawn loss per move in pawns; Opening score is from your side after move 12; Advantage/Resourcefulness calculated from move quality.</p>
           </div>
         </div>

         ${scouting.bestOpening || scouting.openings ? `
         <div class="section">
           <h2>Opening Performance Analysis</h2>
           <p style="color: #666; margin-bottom: 20px; font-style: italic;">
             Analysis of your opening repertoire based on average centipawn evaluation after move 12 and win rates.
           </p>
           
           <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
             ${scouting.bestOpening ? `
             <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
               <h4 style="margin: 0 0 10px 0; color: #155724;">🏆 Best Performing Opening</h4>
               <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">${scouting.bestOpening.name}</p>
               <p style="margin: 5px 0; font-size: 14px;">Average Score: ${(scouting.bestOpening.avgScore || scouting.bestOpening.avgCpAfter12 || 0).toFixed(1)} cp</p>
               <p style="margin: 5px 0; font-size: 14px;">Games Played: ${scouting.bestOpening.games}</p>
             </div>
             ` : ''}
             
             ${scouting.worstOpening ? `
             <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
               <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ Needs Improvement</h4>
               <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">${scouting.worstOpening.name}</p>
               <p style="margin: 5px 0; font-size: 14px;">Average Score: ${(scouting.worstOpening.avgScore || scouting.worstOpening.avgCpAfter12 || 0).toFixed(1)} cp</p>
               <p style="margin: 5px 0; font-size: 14px;">Games Played: ${scouting.worstOpening.games}</p>
             </div>
             ` : ''}
           </div>
              
           ${scouting.openings && scouting.openings.length > 0 ? `
           <h3 style="color: #2c3e50; margin-bottom: 15px;">Complete Opening Repertoire</h3>
           <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
             <thead>
               <tr style="background: #f8f9fa;">
                 <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left;">ECO</th>
                 <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left;">Opening Name</th>
                 <th style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">Games</th>
                 <th style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">Score %</th>
                 <th style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">CP@12</th>
                 <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left;">Game Links</th>
               </tr>
             </thead>
             <tbody>
               ${scouting.openings.slice(0, 15).map(opening => `
                 <tr>
                   <td style="border: 1px solid #dee2e6; padding: 8px; font-weight: bold; color: #2c3e50;">${opening.eco || '-'}</td>
                   <td style="border: 1px solid #dee2e6; padding: 8px;">${opening.name || 'Unknown Opening'}</td>
                   <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center; font-weight: bold;">${opening.games || 0}</td>
                   <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${opening.scorePct ? opening.scorePct.toFixed(1) : '0.0'}%</td>
                   <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center; color: ${(opening.avgCpAfter12 || 0) >= 0 ? '#28a745' : '#dc3545'};">${opening.avgCpAfter12 ? opening.avgCpAfter12.toFixed(1) : '0.0'}</td>
                   <td style="border: 1px solid #dee2e6; padding: 8px;">
                     ${opening.links && opening.links.length > 0 ? 
                       opening.links.slice(0, Math.min(opening.links.length, 8)).map((link, idx) => `<a href="${link}" target="_blank" style="color: #007bff; text-decoration: underline; margin-right: 6px; font-size: 11px;">G${idx + 1}</a>`).join('') 
                       : '-'}
                   </td>
                 </tr>
               `).join('')}
             </tbody>
           </table>
           
           <div style="margin-top: 15px; padding: 12px; background: #e9ecef; border-radius: 6px; font-size: 12px; color: #6c757d;">
             <strong>Note:</strong> CP@12 shows your average position evaluation (in centipawns) after move 12. 
             Positive values indicate better positions for you. Game links are clickable and open the actual games for review.
           </div>
           ` : ''}
         </div>
         ` : ''}

         ${scouting.strengths && scouting.strengths.length > 0 ? `
         <div class="section">
           <h2>🎯 Strengths</h2>
           <p style="color: #666; margin-bottom: 20px; font-style: italic;">
             Areas where your play shows strong performance based on the analysis.
           </p>
           <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
             <ul style="margin: 0; padding-left: 20px;">
               ${scouting.strengths.map(strength => `<li style="margin: 8px 0; font-size: 15px; color: #155724;">${strength}</li>`).join('')}
             </ul>
           </div>
         </div>
         ` : ''}

         ${scouting.focus && scouting.focus.length > 0 ? `
         <div class="section">
           <h2>📈 Focus Next</h2>
           <p style="color: #666; margin-bottom: 20px; font-style: italic;">
             Priority areas for improvement based on your game analysis. Working on these will have the biggest impact on your rating.
           </p>
           <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
             <ul style="margin: 0; padding-left: 20px;">
               ${scouting.focus.map(area => `<li style="margin: 8px 0; font-size: 15px; color: #856404;">${area}</li>`).join('')}
             </ul>
           </div>
         </div>
         ` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated by ChessRep - Chess Analysis Platform</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new SimplePDFGenerator();
