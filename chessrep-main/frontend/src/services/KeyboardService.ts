// Keyboard shortcuts service

import { KeyboardShortcut } from '../types/chess';

export class KeyboardService {
  private static instance: KeyboardService;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private listeners: Map<string, () => void> = new Map();
  private isEnabled = true;

  public static getInstance(): KeyboardService {
    if (!KeyboardService.instance) {
      KeyboardService.instance = new KeyboardService();
    }
    return KeyboardService.instance;
  }

  constructor() {
    this.initializeDefaultShortcuts();
    this.setupEventListeners();
  }

  private initializeDefaultShortcuts(): void {
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        key: 'ArrowLeft',
        action: 'previousMove',
        description: 'Go to previous move'
      },
      {
        key: 'a',
        action: 'previousMove',
        description: 'Go to previous move'
      },
      {
        key: 'ArrowRight',
        action: 'nextMove',
        description: 'Go to next move'
      },
      {
        key: 'd',
        action: 'nextMove',
        description: 'Go to next move'
      },
      {
        key: 'ArrowUp',
        action: 'firstMove',
        description: 'Go to first move'
      },
      {
        key: 'w',
        action: 'firstMove',
        description: 'Go to first move'
      },
      {
        key: 'ArrowDown',
        action: 'lastMove',
        description: 'Go to last move'
      },
      {
        key: 's',
        action: 'lastMove',
        description: 'Go to last move'
      },
      {
        key: 'f',
        action: 'flipBoard',
        description: 'Flip board'
      },
      {
        key: 'z',
        ctrlKey: true,
        action: 'undo',
        description: 'Undo move'
      },
      {
        key: 'y',
        ctrlKey: true,
        action: 'redo',
        description: 'Redo move'
      },
      {
        key: 'Escape',
        action: 'clearSelection',
        description: 'Clear selection'
      },
      {
        key: ' ',
        action: 'playPause',
        description: 'Play/Pause analysis'
      },
      {
        key: 'Enter',
        action: 'confirmMove',
        description: 'Confirm move'
      },
      {
        key: 'Delete',
        action: 'deleteAnnotation',
        description: 'Delete annotation'
      },
      {
        key: 'c',
        action: 'addComment',
        description: 'Add comment'
      },
      {
        key: '1',
        action: 'addSymbol',
        description: 'Add ! symbol'
      },
      {
        key: '2',
        action: 'addSymbol',
        description: 'Add ? symbol'
      },
      {
        key: '3',
        action: 'addSymbol',
        description: 'Add !! symbol'
      },
      {
        key: '4',
        action: 'addSymbol',
        description: 'Add ?? symbol'
      },
      {
        key: 'h',
        action: 'showHelp',
        description: 'Show help'
      },
      {
        key: 'r',
        action: 'resetBoard',
        description: 'Reset board'
      },
      {
        key: 'n',
        action: 'newGame',
        description: 'New game'
      },
      {
        key: 'o',
        action: 'openGame',
        description: 'Open game'
      },
      {
        key: 'p',
        action: 'saveGame',
        description: 'Save game'
      }
    ];

    defaultShortcuts.forEach(shortcut => {
      this.addShortcut(shortcut);
    });
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    const key = event.key;
    const ctrlKey = event.ctrlKey || event.metaKey;
    const shiftKey = event.shiftKey;
    const altKey = event.altKey;

    // Find matching shortcut
    const shortcut = this.findShortcut(key, ctrlKey, shiftKey, altKey);
    
    if (shortcut) {
      event.preventDefault();
      this.executeShortcut(shortcut);
    }
  }

  private findShortcut(key: string, ctrlKey: boolean, shiftKey: boolean, altKey: boolean): KeyboardShortcut | null {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.key === key &&
          shortcut.ctrlKey === ctrlKey &&
          shortcut.shiftKey === shiftKey &&
          shortcut.altKey === altKey) {
        return shortcut;
      }
    }
    return null;
  }

  private executeShortcut(shortcut: KeyboardShortcut): void {
    const listener = this.listeners.get(shortcut.action);
    if (listener) {
      listener();
    }
  }

  addShortcut(shortcut: KeyboardShortcut): void {
    const key = this.generateShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  removeShortcut(shortcut: KeyboardShortcut): void {
    const key = this.generateShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }

  addListener(action: string, callback: () => void): void {
    this.listeners.set(action, callback);
  }

  removeListener(action: string): void {
    this.listeners.delete(action);
  }

  private generateShortcutKey(shortcut: KeyboardShortcut): string {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.altKey) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByAction(action: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter(s => s.action === action);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  isShortcutEnabled(): boolean {
    return this.isEnabled;
  }

  // Helper methods for common actions
  onPreviousMove(callback: () => void): void {
    this.addListener('previousMove', callback);
  }

  onNextMove(callback: () => void): void {
    this.addListener('nextMove', callback);
  }

  onFirstMove(callback: () => void): void {
    this.addListener('firstMove', callback);
  }

  onLastMove(callback: () => void): void {
    this.addListener('lastMove', callback);
  }

  onFlipBoard(callback: () => void): void {
    this.addListener('flipBoard', callback);
  }

  onUndo(callback: () => void): void {
    this.addListener('undo', callback);
  }

  onRedo(callback: () => void): void {
    this.addListener('redo', callback);
  }

  onClearSelection(callback: () => void): void {
    this.addListener('clearSelection', callback);
  }

  onPlayPause(callback: () => void): void {
    this.addListener('playPause', callback);
  }

  onConfirmMove(callback: () => void): void {
    this.addListener('confirmMove', callback);
  }

  onDeleteAnnotation(callback: () => void): void {
    this.addListener('deleteAnnotation', callback);
  }

  onAddComment(callback: () => void): void {
    this.addListener('addComment', callback);
  }

  onAddSymbol(callback: () => void): void {
    this.addListener('addSymbol', callback);
  }

  onShowHelp(callback: () => void): void {
    this.addListener('showHelp', callback);
  }

  onResetBoard(callback: () => void): void {
    this.addListener('resetBoard', callback);
  }

  onNewGame(callback: () => void): void {
    this.addListener('newGame', callback);
  }

  onOpenGame(callback: () => void): void {
    this.addListener('openGame', callback);
  }

  onSaveGame(callback: () => void): void {
    this.addListener('saveGame', callback);
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.shortcuts.clear();
    this.listeners.clear();
  }
}

export const keyboardService = KeyboardService.getInstance();




































































