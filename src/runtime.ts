import * as fs from "fs";
import * as path from "path";
import { DebugData, RuntimeOptions } from "./types";

// Global type declarations
declare global {
  var inlineDebugger: {
    getData: () => DebugData[];
    clearData: () => void;
    printData: () => void;
    getSnapshotData: () => any[];
  };
}

// Configuration constants
const UNDEFINED_FLAG = "__INLINE_DEBUGGER_UNDEFINED__";

/**
 * Inline Debugger Runtime Class
 * Handles monitoring, data collection, and global utilities
 */
export class InlineDebuggerRuntime {
  private dataFile: DebugData[] = [];
  private outputFile: string;
  private isInitialized: boolean = false;

  constructor(options: RuntimeOptions = {}) {
    this.outputFile = options.outputFile || ".debug.data.json";

    // Auto-initialize if in Node.js
    if (typeof process !== "undefined") {
      this.initialize();
    }
  }

  /**
   * Initialize the runtime
   */
  public initialize(options: RuntimeOptions = {}): { outputFile: string } {
    if (options.outputFile) {
      this.outputFile = options.outputFile;
    }

    this.isInitialized = true;

    // Set up process event handlers
    if (typeof process !== "undefined") {
      process.on("exit", () => this.save(false));
      process.on("beforeExit", () => this.save(false));
    }

    return { outputFile: this.outputFile };
  }

  /**
   * Ensure runtime is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      this.initialize();
    }
  }

  /**
   * Stringify function with special handling
   */
  private stringify(obj: any): string {
    let cache: any[] = [];
    const str = JSON.stringify(obj, (_key: string, value: any) => {
      if (typeof value === "function") {
        const fn =
          this.getFn(value.toString()) ?? this.getArrowFn(value.toString());
        return fn;
      }
      if (value === undefined) {
        return UNDEFINED_FLAG;
      }
      if (typeof value === "object" && value !== null) {
        if (value?.then) {
          return "Promise";
        }
        if (cache.indexOf(value) !== -1) {
          return; // Circular reference
        }
        cache.push(value);
      }
      return value;
    });
    cache = [];
    return str;
  }

  /**
   * Get function representation
   */
  private getFn(fnStr: string): string | null {
    const match = fnStr.match(/function\s*(\w*)\s*\([^)]*\)\s*{[\s\S]*}/);
    return match ? match[0] : null;
  }

  /**
   * Get arrow function representation
   */
  private getArrowFn(fnStr: string): string | null {
    const match = fnStr.match(/\([^)]*\)\s*=>\s*{[\s\S]*}/);
    return match ? match[0] : null;
  }

  /**
   * Try to stringify a value
   */
  private tryToStringify(value: any): string {
    try {
      return this.stringify(value);
    } catch (error) {
      return `[Error stringifying: ${(error as Error).message}]`;
    }
  }

  /**
   * Handle error in monitoring
   */
  private onError(error: Error, dataValue: DebugData): void {
    const stringError = this.tryToStringify(error);
    dataValue.type = "error";
    dataValue.called = [error.message, stringError];
  }

  /**
   * Save data to file
   */
  private save(hide: boolean, dataValue?: DebugData): void {
    if (hide) {
      return;
    }

    if (dataValue) {
      this.dataFile.push(dataValue);
    }

    // Always write to file
    const outputPath = path.join(process.cwd(), this.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(this.dataFile, null, 2));
  }

  /**
   * Main monitoring function
   */
  public inlineDebuggerWatch(data: DebugData): any {
    this.ensureInitialized(); // Auto-initialize if needed

    const dataValue: DebugData = {
      ...data,
      called: "Failed Promise. Please use a .catch to display it",
    };
    let called: any;

    try {
      called = data.called();
    } catch (error) {
      this.onError(error as Error, dataValue);
      this.save(data.hide || false, dataValue);
      throw error;
    }

    if (data.type === "error") {
      this.onError(called as Error, dataValue);
      this.save(data.hide || false, dataValue);
      throw called;
    }

    if (called?.then) {
      data.called = called
        .then((r: any) => {
          dataValue.prefix = "Resolved Promise: ";
          dataValue.called = this.tryToStringify(r);
          this.save(data.hide || false, dataValue);
          return r;
        })
        .catch((err: any) => {
          dataValue.prefix = "Rejected Promise: ";
          dataValue.called = this.tryToStringify(err);
          this.save(data.hide || false, dataValue);
          throw err;
        });
    } else {
      dataValue.called = this.tryToStringify(called);
      this.save(data.hide || false, dataValue);
    }

    return called;
  }

  /**
   * Console log wrapper
   */
  public debugLog(logFn: (...args: any[]) => void, data: DebugData): void {
    this.ensureInitialized(); // Auto-initialize if needed

    logFn(...data.called);
    data.called = data.called.map((entry: any) => this.tryToStringify(entry));
    // Add file path if not present
    if (!data.filePath) {
      data.filePath = "unknown";
    }
    this.save(false, data);
  }

  /**
   * Setup global utilities for testing environments
   */
  public setupGlobals(): void {
    this.ensureInitialized(); // Auto-initialize if needed

    // Make runtime functions available globally
    if (typeof global !== "undefined") {
      (global as any).inlineDebuggerWatch = this.inlineDebuggerWatch.bind(this);
      (global as any).debugLog = this.debugLog.bind(this);

      // Global test utilities
      (global as any).inlineDebugger = {
        getData: (): DebugData[] => {
          if (fs.existsSync(this.outputFile)) {
            return JSON.parse(fs.readFileSync(this.outputFile, "utf8"));
          }
          return [];
        },

        clearData: (): void => {
          if (fs.existsSync(this.outputFile)) {
            fs.unlinkSync(this.outputFile);
          }
        },

        printData: (): void => {
          const data = (global as any).inlineDebugger.getData();
          console.log("📊 Debug Results:");
          data.forEach((item: any, index: number) => {
            const {
              type,
              variable,
              called,
              line,
              filePath,
              prefix = "",
            } = item;
            const fileName = path.basename(filePath);
            const lineInfo = line ? ` (line ${line})` : "";
            const fileInfo = filePath ? ` [${fileName}]` : "";

            if (type === "variable") {
              console.log(
                `${index + 1}. ${variable} = ${called}${lineInfo}${fileInfo}`
              );
            } else if (type === "expression") {
              console.log(
                `${index + 1}. ${prefix}${called}${lineInfo}${fileInfo}`
              );
            } else if (type === "log") {
              console.log(
                `${index + 1}. [LOG] ${called}${lineInfo}${fileInfo}`
              );
            } else if (type === "error") {
              console.log(
                `${index + 1}. [ERROR] ${called}${lineInfo}${fileInfo}`
              );
            }
          });
        },

        getSnapshotData: (): any[] => {
          const data = (global as any).debugger.getData();
          return data.map((item: any) => ({
            type: item.type,
            variable: item.variable,
            called: item.called,
            line: item.line,
            filePath: path.basename(item.filePath),
            prefix: item.prefix,
          }));
        },
      };
    }
  }
}

// Create global instance
const runtime = new InlineDebuggerRuntime();

// Export for use in transformed code
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    // Class exports
    InlineDebuggerRuntime,

    // Instance methods (bound to global instance)
    inlineDebuggerWatch: runtime.inlineDebuggerWatch.bind(runtime),
    debugLog: runtime.debugLog.bind(runtime),
    initializeRuntime: runtime.initialize.bind(runtime),
    setupGlobals: runtime.setupGlobals.bind(runtime),

    // Utility functions
    stringify: runtime["stringify"].bind(runtime),
    tryToStringify: runtime["tryToStringify"].bind(runtime),
  };
} else if (typeof (global as any).window !== "undefined") {
  ((global as any).window as any).InlineDebuggerRuntime = InlineDebuggerRuntime;
  ((global as any).window as any).inlineDebuggerWatch =
    runtime.inlineDebuggerWatch.bind(runtime);
  ((global as any).window as any).debugLog = runtime.debugLog.bind(runtime);
  ((global as any).window as any).initializeRuntime =
    runtime.initialize.bind(runtime);
  ((global as any).window as any).setupGlobals =
    runtime.setupGlobals.bind(runtime);
}

// Auto-initialize and setup globals when requiring runtime
if (
  typeof process !== "undefined" &&
  process.env["INLINE_DEBUGGER_ENABLED"] !== "false"
) {
  (runtime as any).ensureInitialized();
  runtime.setupGlobals();
}
