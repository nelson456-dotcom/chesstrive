// Game report service for analysis and statistics

import { GameReport, CriticalMoment, AccuracyData, MoveNode, Evaluation } from '../types/chess';
import stockfishCloudService from './StockfishCloudService';

export class GameReportService {
  private static instance: GameReportService;
  
  public static getInstance(): GameReportService {
    if (!GameReportService.instance) {
      GameReportService.instance = new GameReportService();
    }
    return GameReportService.instance;
  }

  async generateGameReport(moveTree: MoveNode[]): Promise<GameReport> {
    if (moveTree.length === 0) {
      throw new Error('No moves to analyze');
    }

    // Analyze each move
    const accuracyData: AccuracyData[] = [];
    const criticalMoments: CriticalMoment[] = [];
    let mistakes = 0;
    let blunders = 0;
    let inaccuracies = 0;

    for (let i = 0; i < moveTree.length; i++) {
      const moveNode = moveTree[i];
      
      // Get engine evaluation for this position
      const evaluation = await this.analyzeMove(moveNode);
      
      // Calculate accuracy
      const accuracy = this.calculateAccuracy(moveNode, evaluation);
      
      // Classify move
      const classification = this.classifyMove(accuracy);
      
      // Count mistakes
      if (classification === 'mistake') mistakes++;
      if (classification === 'blunder') blunders++;
      if (classification === 'inaccuracy') inaccuracies++;

      accuracyData.push({
        moveNumber: i + 1,
        accuracy,
        evaluation: evaluation?.value || 0,
        bestMove: evaluation?.pv?.[0] || '',
        playedMove: moveNode.move.san,
        classification
      });

      // Check for critical moments
      if (i > 0) {
        const prevEval = accuracyData[i - 1].evaluation;
        const currEval = evaluation?.value || 0;
        const evalChange = Math.abs(currEval - prevEval);
        
        if (evalChange > 1.0) {
          criticalMoments.push({
            moveNumber: i + 1,
            move: moveNode.move.san,
            evaluationChange: currEval - prevEval,
            description: currEval > prevEval ? 'Advantage gained' : 'Advantage lost',
            type: evalChange > 3.0 ? 'blunder' : evalChange > 1.5 ? 'mistake' : 'advantage_gained'
          });
        }
      }
    }

    // Calculate overall accuracy
    const overallAccuracy = accuracyData.reduce((sum, data) => sum + data.accuracy, 0) / accuracyData.length;
    
    // Calculate white and black accuracy
    const whiteMoves = accuracyData.filter((_, index) => index % 2 === 0);
    const blackMoves = accuracyData.filter((_, index) => index % 2 === 1);
    
    const whiteAccuracy = whiteMoves.length > 0 
      ? whiteMoves.reduce((sum, data) => sum + data.accuracy, 0) / whiteMoves.length 
      : 0;
    
    const blackAccuracy = blackMoves.length > 0 
      ? blackMoves.reduce((sum, data) => sum + data.accuracy, 0) / blackMoves.length 
      : 0;

    return {
      id: `report_${Date.now()}`,
      totalMoves: moveTree.length,
      overallAccuracy,
      whiteAccuracy,
      blackAccuracy,
      criticalMoments,
      accuracyData,
      mistakes,
      blunders,
      inaccuracies,
      generatedAt: new Date()
    };
  }

  private async analyzeMove(moveNode: MoveNode): Promise<Evaluation | null> {
    try {
      // Get position before the move
      const positionBeforeMove = this.getPositionBeforeMove(moveNode);
      
      // Analyze with engine
      const evaluation = await stockfishCloudService.getEvaluation(positionBeforeMove);
      return evaluation;
    } catch (error) {
      console.error('Failed to analyze move:', error);
      return null;
    }
  }

  private getPositionBeforeMove(moveNode: MoveNode): string {
    // This would reconstruct the position before the move
    // For now, return a placeholder
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  private calculateAccuracy(moveNode: MoveNode, evaluation: Evaluation | null): number {
    if (!evaluation) return 50; // Default accuracy if no evaluation

    // This is a simplified accuracy calculation
    // In practice, you'd compare the played move with the best move
    const moveQuality = this.assessMoveQuality(moveNode, evaluation);
    
    // Convert to percentage (0-100)
    return Math.max(0, Math.min(100, 50 + moveQuality * 25));
  }

  private assessMoveQuality(moveNode: MoveNode, evaluation: Evaluation): number {
    // Simplified move quality assessment
    // In practice, you'd compare with engine's best move
    
    if (evaluation.type === 'mate') {
      return evaluation.value > 0 ? 1 : -1;
    }
    
    // For centipawn evaluation, convert to quality score
    const cpValue = evaluation.value;
    if (Math.abs(cpValue) < 0.1) return 0; // Equal position
    if (Math.abs(cpValue) < 0.5) return 0.5; // Slight advantage
    if (Math.abs(cpValue) < 1.0) return 1; // Clear advantage
    if (Math.abs(cpValue) < 2.0) return 1.5; // Significant advantage
    return 2; // Winning advantage
  }

  private classifyMove(accuracy: number): string {
    if (accuracy >= 90) return 'brilliant';
    if (accuracy >= 80) return 'great';
    if (accuracy >= 70) return 'good';
    if (accuracy >= 60) return 'inaccuracy';
    if (accuracy >= 40) return 'mistake';
    return 'blunder';
  }

  generateAccuracyChart(accuracyData: AccuracyData[]): any {
    return {
      labels: accuracyData.map(data => data.moveNumber.toString()),
      datasets: [
        {
          label: 'Accuracy',
          data: accuracyData.map(data => data.accuracy),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }
      ]
    };
  }

  generateEvaluationChart(accuracyData: AccuracyData[]): any {
    return {
      labels: accuracyData.map(data => data.moveNumber.toString()),
      datasets: [
        {
          label: 'Evaluation',
          data: accuracyData.map(data => data.evaluation),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    };
  }

  exportReport(report: GameReport, format: 'json' | 'csv' | 'pdf' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'csv':
        return this.exportToCSV(report);
      
      case 'pdf':
        return this.exportToPDF(report);
      
      default:
        throw new Error('Unsupported export format');
    }
  }

  private exportToCSV(report: GameReport): string {
    const headers = ['Move', 'Accuracy', 'Evaluation', 'Best Move', 'Played Move', 'Classification'];
    const rows = report.accuracyData.map(data => [
      data.moveNumber,
      data.accuracy.toFixed(1),
      data.evaluation.toFixed(2),
      data.bestMove,
      data.playedMove,
      data.classification
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private exportToPDF(report: GameReport): string {
    // This would generate a PDF report
    // For now, return a placeholder
    return `PDF Report for Game ${report.id}`;
  }
}

export const gameReportService = GameReportService.getInstance();











