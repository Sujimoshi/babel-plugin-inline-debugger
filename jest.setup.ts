// Runtime auto-initializes and sets up globals when required
import "./src/runtime";

beforeEach(() => {
  // Clear debug data before each test
  global.inlineDebugger.clearData();
});
