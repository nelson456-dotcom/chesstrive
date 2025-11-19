/**
 * Lichess-Style Analysis Engine
 * Provides streaming Multi-PV analysis with full continuations
 */

import { Chess } from 'chess.js';
import streamingAnalysisService, { StreamedPV, AnalysisConfig } from './StreamingAnalysisService';

export interface AnalysisSettings {
  multiPV: number; // 1, 2, 3, or 5
  pvLength: number; // 6, 10, 16, or 24+
  depthCap?: number;
  timeLimit?: number;
  hash?: number;
  threads?: number;
}

export interface AnalysisState {
  isRunning: boolean;
  currentNodeId: string | null;
  pvs: StreamedPV[];
  depth: number;
  error: string | null;
  firstPVLatency: number | null;
}

export type PVUpdateCallback = (pv: StreamedPV) => void;
export type StateUpdateCallback = (state: AnalysisState) => void;
export type ErrorCallback = (error: Error) => void;

class LichessAnalysisEngine {
  private currentCancel: (() => void) | null = null;
  private currentState: AnalysisState = {
    isRunning: false,
    currentNodeId: null,
    pvs: [],
    depth: 0,
    error: null,
    firstPVLatency: null
  };
  private stateCallbacks: Set<StateUpdateCallback> = new Set();
  private pvCallbacks: Set<PVUpdateCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();

  /**
   * Get current analysis state
   */
  getState(): AnalysisState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to state updates
   */
  onStateUpdate(callback: StateUpdateCallback): () => void {
    this.stateCallbacks.add(callback);
    return () => this.stateCallbacks.delete(callback);
  }

  /**
   * Subscribe to PV updates
   */
  onPVUpdate(callback: PVUpdateCallback): () => void {
    this.pvCallbacks.add(callback);
    return () => this.pvCallbacks.delete(callback);
  }

  /**
   * Subscribe to errors
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Update state and notify subscribers
   */
  private updateState(updates: Partial<AnalysisState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.stateCallbacks.forEach(cb => cb(this.currentState));
  }

  /**
   * Validate position and check if terminal
   */
  private validatePosition(fen: string): { valid: boolean; error?: string; terminal?: boolean } {
    try {
      // Basic FEN format validation first
      if (!fen || typeof fen !== 'string' || fen.trim() === '') {
        return { valid: false, error: 'FEN is empty' };
      }
      
      // Check FEN has required parts (at least board position)
      const fenParts = fen.trim().split(/\s+/);
      if (fenParts.length < 1) {
        return { valid: false, error: 'Invalid FEN format' };
      }
      
      // Try to create Chess instance - if it fails, FEN is invalid
      // Don't check game over state here - let the backend handle that
      // This avoids version compatibility issues with chess.js
      const game = new Chess(fen);
      
      // Just verify we can get moves (basic validation)
      try {
        game.moves();
      } catch (e) {
        return { valid: false, error: 'Invalid position' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Invalid FEN: ${error.message || 'Unknown error'}` };
    }
  }

  /**
   * Generate unique node ID from FEN and path
   */
  private generateNodeId(fen: string, path?: number[]): string {
    const pathStr = path ? JSON.stringify(path) : '';
    return `${fen}-${pathStr}`;
  }

  /**
   * Format evaluation for display (White POV)
   */
  formatEvaluation(evaluation: StreamedPV['evaluation']): string {
    if (evaluation.type === 'mate') {
      const mateValue = evaluation.value > 0 ? Math.ceil(evaluation.value / 10000) : Math.floor(evaluation.value / 10000);
      return `#${mateValue}`;
    }
    const cp = evaluation.value / 100;
    return cp > 0 ? `+${cp.toFixed(2)}` : cp.toFixed(2);
  }

  /**
   * Start analysis for a position
   */
  async startAnalysis(
    fen: string,
    settings: AnalysisSettings,
    nodeId?: string,
    path?: number[]
  ): Promise<void> {
    // Cancel any existing analysis
    this.stopAnalysis();

    // Validate position
    const validation = this.validatePosition(fen);
    if (!validation.valid) {
      const error = new Error(validation.error || 'Invalid position');
      this.updateState({
        isRunning: false,
        error: error.message
      });
      this.errorCallbacks.forEach(cb => cb(error));
      return;
    }

    if (validation.terminal) {
      this.updateState({
        isRunning: false,
        error: validation.error || 'Terminal position',
        pvs: []
      });
      return;
    }

    // Generate node ID
    const currentNodeId = nodeId || this.generateNodeId(fen, path);
    
    // Reset state
    this.updateState({
      isRunning: true,
      currentNodeId,
      pvs: [],
      depth: 0,
      error: null,
      firstPVLatency: null
    });

    // Log telemetry
    const startTime = Date.now();
    console.log('📊 TELEMETRY: analysis_start', {
      fen,
      nodeId: currentNodeId,
      multipv: settings.multiPV,
      pv_len_target: settings.pvLength,
      cap: { depth: settings.depthCap, time: settings.timeLimit },
      timestamp: startTime
    });

    // Start streaming analysis
    try {
      console.log('🔍 LichessAnalysisEngine: Creating analysis config');
      console.log('🔍 FEN:', fen);
      console.log('🔍 FEN type:', typeof fen);
      console.log('🔍 FEN length:', fen ? fen.length : 'null/undefined');
      
      const config: AnalysisConfig = {
        fen,
        multiPV: settings.multiPV,
        depthCap: settings.depthCap || 20,
        timeLimit: settings.timeLimit || 750,
        pvLength: settings.pvLength,
        nodeId: currentNodeId
      };

      console.log('🔍 LichessAnalysisEngine: Config created, calling streamingAnalysisService.startAnalysis');
      console.log('🔍 Config FEN:', config.fen);
      
      this.currentCancel = await streamingAnalysisService.startAnalysis(
        config,
        (pv: StreamedPV) => {
          // Update PVs array
          const existingPVs = [...this.currentState.pvs];
          const existingIndex = existingPVs.findIndex(p => p.lineIndex === pv.lineIndex);
          
          if (existingIndex >= 0) {
            existingPVs[existingIndex] = pv;
          } else {
            existingPVs.push(pv);
            existingPVs.sort((a, b) => a.lineIndex - b.lineIndex);
          }

          // Track first PV latency
          if (this.currentState.firstPVLatency === null && pv.latency_ms) {
            this.updateState({
              pvs: existingPVs,
              depth: Math.max(this.currentState.depth, pv.depth),
              firstPVLatency: pv.latency_ms
            });

            // Log telemetry
            console.log('📊 TELEMETRY: first_pv_received', {
              latency_ms: pv.latency_ms,
              lineIndex: pv.lineIndex,
              depth: pv.depth,
              pvLength: pv.pv.length
            });

            if (pv.latency_ms > 2000) {
              console.warn(`⚠️ TELEMETRY ALERT: first_pv_latency_ms (${pv.latency_ms}ms) > 2000ms`);
            }
          } else {
            this.updateState({
              pvs: existingPVs,
              depth: Math.max(this.currentState.depth, pv.depth)
            });
          }

          // Log PV received
          console.log('📊 TELEMETRY: pv_received', {
            lineIndex: pv.lineIndex,
            depth: pv.depth,
            pvLength: pv.pv.length,
            latency_ms_from_start: pv.latency_ms || 0
          });

          // Notify PV subscribers
          this.pvCallbacks.forEach(cb => cb(pv));
        },
        (error: Error) => {
          console.error('❌ LichessAnalysisEngine: Analysis error:', error);
          console.error('❌ LichessAnalysisEngine: Error message:', error.message);
          console.error('❌ LichessAnalysisEngine: Error stack:', error.stack);
          this.updateState({
            isRunning: false,
            error: error.message
          });
          this.errorCallbacks.forEach(cb => cb(error));

          console.log('📊 TELEMETRY: analysis_stopped', {
            reason: 'error',
            pv_count: this.currentState.pvs.length,
            elapsed_ms: Date.now() - startTime
          });
        },
        (allPVs: StreamedPV[]) => {
          console.log('✅ Analysis complete:', allPVs.length, 'PVs');
          this.updateState({
            isRunning: false,
            pvs: allPVs
          });

          console.log('📊 TELEMETRY: analysis_stopped', {
            reason: 'bestmove_received',
            pv_count: allPVs.length,
            elapsed_ms: Date.now() - startTime
          });

          // Alert if no PVs received
          if (allPVs.length === 0) {
            console.warn('⚠️ TELEMETRY ALERT: pv_received == 0');
          }
        }
      );
    } catch (error) {
      console.error('❌ LichessAnalysisEngine: Error starting analysis', error);
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('❌ LichessAnalysisEngine: Error message:', err.message);
      console.error('❌ LichessAnalysisEngine: Error stack:', err.stack);
      this.updateState({
        isRunning: false,
        error: err.message
      });
      this.errorCallbacks.forEach(cb => cb(err));
    }
  }

  /**
   * Stop current analysis
   */
  stopAnalysis(): void {
    if (this.currentCancel) {
      this.currentCancel();
      this.currentCancel = null;
    }

    if (this.currentState.isRunning) {
      console.log('📊 TELEMETRY: analysis_stopped', {
        reason: 'user_stop',
        pv_count: this.currentState.pvs.length,
        elapsed_ms: 0
      });
    }

    this.updateState({
      isRunning: false
    });
  }

  /**
   * Check if analysis should be cancelled due to node change
   */
  shouldCancelForNode(fen: string, nodeId?: string, path?: number[]): boolean {
    if (!this.currentState.isRunning) return false;
    
    const newNodeId = nodeId || this.generateNodeId(fen, path);
    return this.currentState.currentNodeId !== newNodeId;
  }
}

export const lichessAnalysisEngine = new LichessAnalysisEngine();
export default lichessAnalysisEngine;

