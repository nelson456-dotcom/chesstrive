const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ],
        timeout: 60000
      });
    }
  }

  async generateReport(data) {
    let browser = null;
    let page = null;
    
    try {
      // Create a fresh browser instance for each PDF generation to avoid issues
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        timeout: 30000
      });
      
      page = await browser.newPage();
      
      // Set a longer timeout for the page
      page.setDefaultTimeout(60000);
      
      const html = this.generateHTML(data);
      await page.setContent(html, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        timeout: 30000,
        preferCSSPageSize: false
      });
      
      console.log(`[PDFGenerator] Successfully generated PDF, size: ${pdfBuffer.length} bytes`);
      return pdfBuffer;
      
    } catch (error) {
      console.log(`[PDFGenerator] Error generating PDF: ${error.message}`);
      throw error;
    } finally {
      // Always clean up
      if (page) {
        try {
          await page.close();
        } catch (e) {
          console.log(`[PDFGenerator] Error closing page: ${e.message}`);
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.log(`[PDFGenerator] Error closing browser: ${e.message}`);
        }
      }
    }
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
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
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
          a {
            color: #007bff;
            text-decoration: underline;
          }
          a:hover {
            color: #0056b3;
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

        <!-- SCOUTING REPORT - EXACT MATCH -->
        ${scouting ? `
        <div class="section">
          <h2>Scouting Report - ${username}</h2>
          <p style="color: #28a745; font-weight: bold; margin-bottom: 15px;">✅ UPDATED PDF TEMPLATE - ${new Date().toISOString()}</p>
          
          <!-- EXACT METRICS LAYOUT -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${(scouting.bestMoveRate || 0).toFixed(1)}%</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">Best Move Rate</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${(scouting.blundersPer100 || 0).toFixed(1)}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">Blunders /100</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${(scouting.acpl || 0).toFixed(3)}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">ACPL (pawns)</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${(scouting.endgameLossPerMove || 0).toFixed(3)}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">Endgame loss/ move (pawns)</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${(scouting.accuracyPercent || 0).toFixed(1)}%</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">Accuracy</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${(scouting.advantageCapitalization || 0).toFixed(1)}%</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">Advantage Capitalization</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${(scouting.resourcefulness || 0).toFixed(1)}%</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">Resourcefulness</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0; text-align: center;">
              <div style="font-size: 28px; font-weight: bold; color: #2c3e50;">${(scouting.blundersPerGame || 0).toFixed(2)}</div>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">Blunders per Game</div>
            </div>
          </div>

          <!-- Strengths -->
          ${scouting.strengths && scouting.strengths.length > 0 ? `
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">💪 Strengths</h3>
            <ul style="margin: 0; padding-left: 20px; color: #155724;">
              ${scouting.strengths.map(strength => `<li style="margin-bottom: 8px;">${strength}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <!-- Focus Areas -->
          ${scouting.focus && scouting.focus.length > 0 ? `
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">🎯 Focus next</h3>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              ${scouting.focus.map(focus => `<li style="margin-bottom: 8px;">${focus}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

        </div>

        <!-- ALL OPENINGS - EXACT MATCH WITH CLICKABLE LINKS -->
        ${scouting && scouting.openings ? `
        <div class="section">
          <h2>All Openings (by frequency)</h2>
          
          <!-- Best and Worst with CLICKABLE LINKS -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            ${scouting.bestOpening ? `
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
              <h4 style="margin: 0 0 15px 0; color: #155724;">🏆 Best Performance Opening</h4>
              <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #155724;">${scouting.bestOpening.name}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #155724;">ECO: ${scouting.bestOpening.eco || 'N/A'}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #155724;">Games: ${scouting.bestOpening.games} | Score: ${scouting.bestOpening.scorePct.toFixed(1)}%</p>
              <p style="margin: 5px 0; font-size: 14px; color: #155724;">CP@12: ${(scouting.bestOpening.avgCpAfter12 || 0).toFixed(2)}</p>
              ${scouting.bestOpening.links && scouting.bestOpening.links.length > 0 ? `
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0; font-size: 13px; font-weight: bold; color: #155724;">Game Links:</p>
                ${scouting.bestOpening.links.slice(0, 5).map(link => 
                  `<a href="${link}" target="_blank" style="font-size: 11px; color: #007bff; display: block; margin: 3px 0; text-decoration: underline;">${link}</a>`
                ).join('')}
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            ${scouting.worstOpening ? `
            <div style="background: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
              <h4 style="margin: 0 0 15px 0; color: #721c24;">⚠️ Low Performance Opening</h4>
              <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #721c24;">${scouting.worstOpening.name}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #721c24;">ECO: ${scouting.worstOpening.eco || 'N/A'}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #721c24;">Games: ${scouting.worstOpening.games} | Score: ${scouting.worstOpening.scorePct.toFixed(1)}%</p>
              <p style="margin: 5px 0; font-size: 14px; color: #721c24;">CP@12: ${(scouting.worstOpening.avgCpAfter12 || 0).toFixed(2)}</p>
              ${scouting.worstOpening.links && scouting.worstOpening.links.length > 0 ? `
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0; font-size: 13px; font-weight: bold; color: #721c24;">Game Links:</p>
                ${scouting.worstOpening.links.slice(0, 5).map(link => 
                  `<a href="${link}" target="_blank" style="font-size: 11px; color: #007bff; display: block; margin: 3px 0; text-decoration: underline;">${link}</a>`
                ).join('')}
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>

          <!-- Complete Table with CLICKABLE LINKS -->
          ${scouting.openings && scouting.openings.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                <th style="padding: 15px 10px; text-align: left; font-weight: 600; color: #2c3e50;">ECO</th>
                <th style="padding: 15px 10px; text-align: left; font-weight: 600; color: #2c3e50;">Name</th>
                <th style="padding: 15px 10px; text-align: center; font-weight: 600; color: #2c3e50;">Games</th>
                <th style="padding: 15px 10px; text-align: center; font-weight: 600; color: #2c3e50;">Score%</th>
                <th style="padding: 15px 10px; text-align: center; font-weight: 600; color: #2c3e50;">CP@12</th>
                <th style="padding: 15px 10px; text-align: left; font-weight: 600; color: #2c3e50;">Links</th>
              </tr>
            </thead>
            <tbody>
              ${scouting.openings.slice(0, 15).map((opening, index) => `
              <tr style="border-bottom: 1px solid #dee2e6; ${index % 2 === 0 ? 'background: #f8f9fa;' : 'background: white;'}">
                <td style="padding: 12px 10px; font-family: 'Courier New', monospace; font-weight: bold; color: #2c3e50;">${opening.eco || 'N/A'}</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${opening.name}</td>
                <td style="padding: 12px 10px; text-align: center; font-weight: bold; color: #2c3e50;">${opening.games}</td>
                <td style="padding: 12px 10px; text-align: center; font-weight: bold; color: ${opening.scorePct >= 60 ? '#28a745' : opening.scorePct >= 40 ? '#ffc107' : '#dc3545'};">${opening.scorePct.toFixed(1)}%</td>
                <td style="padding: 12px 10px; text-align: center; font-weight: bold; color: ${(opening.avgCpAfter12 || 0) >= 0 ? '#28a745' : '#dc3545'};">${(opening.avgCpAfter12 || 0).toFixed(2)}</td>
                <td style="padding: 12px 10px;">
                  ${opening.links && opening.links.length > 0 ? 
                    opening.links.slice(0, 3).map(link => 
                      `<a href="${link}" target="_blank" style="font-size: 10px; color: #007bff; display: block; margin: 2px 0; text-decoration: underline;">${link.split('/').pop()}</a>`
                    ).join('') 
                    : '<span style="color: #999; font-style: italic;">No games</span>'}
                </td>
              </tr>
              `).join('')}
            </tbody>
          </table>
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

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new PDFGenerator();

