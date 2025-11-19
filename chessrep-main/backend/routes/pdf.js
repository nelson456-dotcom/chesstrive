const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pdfGenerator = require('../services/pdfGenerator');
const simplePdfGenerator = require('../services/simplePdfGenerator');
const axios = require('axios');

// PDF endpoint now reuses main analysis - no duplicate fetch functions needed

/**
 * GET /api/pdf/report?username=<handle>&timeClass=<class>&platform=<platform>
 * Generates PDF report by reusing the main analysis endpoint (no duplicate analysis)
 */
router.get('/report', auth, async (req, res) => {
  try {
    const handle = (req.query.username || '').toString().trim().toLowerCase();
    const timeClass = (req.query.timeClass || '').toString().trim().toLowerCase();
    const platform = (req.query.platform || '').toString().trim().toLowerCase();
    
    if (!handle) {
      return res.status(400).json({ message: 'Username is required' });
    }
    
    console.log(`[PDF Report] Generating PDF for username: ${handle}, timeClass: ${timeClass}, platform: ${platform}`);
    
    // **CRITICAL FIX**: Reuse the main analysis endpoint to avoid duplicate computation
    // Use the same host/port as the current request to avoid port mismatch
    const baseUrl = `${req.protocol}://${req.get('host') || `localhost:${process.env.PORT || 3001}`}`;
    const analysisUrl = `${baseUrl}/api/games/report/40?username=${encodeURIComponent(handle)}&platform=${platform || 'chesscom'}&timeClass=${timeClass || 'all'}`;
    
    console.log(`[PDF Report] Fetching analysis from: ${analysisUrl}`);
    
    let analysisData;
    try {
      console.log(`[PDF Report] Making request to analysis endpoint...`);
      const analysisResponse = await axios.get(analysisUrl, {
        headers: {
          'Authorization': req.headers.authorization, // Forward auth header
          'User-Agent': 'ChessRep-PDF/1.0'
        },
        timeout: 120000 // 2 minutes timeout for full analysis
      });
      analysisData = analysisResponse.data;
      console.log(`[PDF Report] Analysis response received:`, {
        status: analysisResponse.status,
        hasSummary: !!analysisData.summary,
        hasMetrics: !!analysisData.metrics,
        hasScouting: !!analysisData.scouting,
        gamesCount: analysisData.games?.length || 0
      });
    } catch (error) {
      console.error('[PDF Report] Failed to fetch analysis:', error.message);
      if (error.response) {
        console.error('[PDF Report] Response status:', error.response.status);
        console.error('[PDF Report] Response data:', error.response.data);
      }
      return res.status(500).json({ 
        message: 'Failed to fetch game analysis for PDF generation', 
        error: error.message 
      });
    }
    
    if (!analysisData || !analysisData.summary) {
      return res.status(404).json({ 
        message: `No analysis data found for username: ${handle}. Please ensure games are available.` 
      });
    }
    
    console.log(`[PDF Report] Analysis complete - generating PDF with ${analysisData.games?.length || 0} games...`);
    
    // **FIXED**: Use exact same data structure as main report
    const pdfData = {
      username: handle,
      summary: analysisData.summary,
      metrics: analysisData.metrics,
      scouting: analysisData.scouting,
      games: analysisData.games || [],
      // Add radar chart data for visualization (matches the image style)
      radarData: analysisData.scouting?.peerComparison?.playerStats || {
        opening: Math.round((analysisData.scouting?.openingScore || 0) * 10 + 50),
        tactics: Math.round(100 - (analysisData.scouting?.blundersPer100 || 5) * 5),
        ending: Math.round(100 - (analysisData.scouting?.endgameLossPerMove || 0.1) * 500),
        advantage: Math.round(analysisData.scouting?.advantageCapitalization || 50),
        resourcefulness: Math.round(analysisData.scouting?.resourcefulness || 40),
        timeManagement: Math.round(75)
      },
      // Add peer comparison data for rating-based analysis
      peerComparison: analysisData.scouting?.peerComparison || null,
      playerRating: analysisData.scouting?.playerRating || null
    };
    
    console.log(`[PDF Report] PDF data prepared:`, {
      games: pdfData.games.length,
      totalMoves: pdfData.summary.total,
      accuracy: pdfData.scouting.accuracyPercent,
      openings: pdfData.scouting.openings?.length || 0
    });
    
    try {
      // Force reload the PDF generator to ensure latest changes
      delete require.cache[require.resolve('../services/pdfGenerator')];
      const freshPdfGenerator = require('../services/pdfGenerator');
      console.log(`[PDF Report] USING UPDATED PDF TEMPLATE - ${new Date().toISOString()}`);
      
      // Try Puppeteer first
      const pdfBuffer = await freshPdfGenerator.generateReport(pdfData);
      console.log(`[PDF Report] Puppeteer PDF generated successfully, size: ${pdfBuffer.length} bytes`);
      
      // Verify it's actually a PDF by checking the header
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      if (pdfHeader !== '%PDF') {
        console.log(`[PDF Report] Puppeteer generated invalid PDF (header: ${pdfHeader})`);
        throw new Error('Invalid PDF format from Puppeteer');
      }
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="chess-report-${handle}-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      
    } catch (error) {
      console.log(`[PDF Report] Puppeteer failed: ${error.message}`);
      console.log(`[PDF Report] Using HTML fallback that user can save as PDF`);
      
      // Use HTML fallback that can be saved as PDF by the user
      const htmlBuffer = simplePdfGenerator.generateReport(pdfData);
      console.log(`[PDF Report] HTML report generated successfully, size: ${htmlBuffer.length} bytes`);
      
      // Serve as HTML with print-friendly CSS
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="chess-report-${handle}-${new Date().toISOString().split('T')[0]}.html"`);
      
      const htmlWithPrintScript = htmlBuffer.toString().replace('</body>', `
        <script>
          // Auto-open print dialog for easy PDF saving
          window.onload = function() {
            setTimeout(function() {
              if (confirm('Would you like to save this report as PDF?\\n\\nClick OK to open the print dialog, then choose "Save as PDF" as your printer.')) {
                window.print();
              }
            }, 1000);
          };
        </script>
        </body>
      `);
      
      return res.send(htmlWithPrintScript);
    }
    
  } catch (error) {
    console.error('[PDF Report] Error:', error);
    res.status(500).json({ 
      message: 'Failed to generate PDF report', 
      error: error.message 
    });
  }
});

module.exports = router;