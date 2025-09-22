/**
 * Type definitions for Inline Debugger
 */

export interface DebugData {
  type: 'variable' | 'expression' | 'log' | 'error';
  variable?: string;
  called: any;
  line?: number;
  filePath: string;
  prefix?: string;
  hide?: boolean;
}

export interface RuntimeOptions {
  outputFile?: string;
}

export interface BabelPluginOptions {
  outputFile?: string;
}

export interface GlobalDebugger {
  getData: () => DebugData[];
  clearData: () => void;
  printData: () => void;
  getSnapshotData: () => any[];
}

export interface GlobalWindow {
  inlineDebuggerWatch?: (data: DebugData) => any;
  debugLog?: (logFn: (...args: any[]) => void, data: DebugData) => void;
  debugger?: GlobalDebugger;
}

export interface GlobalNode {
  inlineDebuggerWatch?: (data: DebugData) => any;
  debugLog?: (logFn: (...args: any[]) => void, data: DebugData) => void;
  debugger?: GlobalDebugger;
}
