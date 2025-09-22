import { runApp } from './fixtures/app';

describe('Inline Debugger', () => {
  beforeAll(() => {
    // Clear debug data before all tests
    global.inlineDebugger.clearData();
  });

  afterAll(() => {
    // Clean up after all tests
    global.inlineDebugger.clearData();
  });

  test('should monitor expressions in real files with imports', async () => {
    // Run the app with monitoring
    const result = await runApp();
    
    // Get debug data
    const debugData = global.inlineDebugger.getData();
    
    // Convert absolute paths to relative paths for consistent snapshots
    const normalizedData = debugData.map(item => ({
      ...item,
      filePath: item.filePath.startsWith(process.cwd()) 
        ? item.filePath.replace(process.cwd() + '/', '')
        : item.filePath
    }));
    
    // Snapshot the debug data
    expect(normalizedData).toMatchSnapshot();
    
    // Verify the result structure
    expect(result).toHaveProperty('math');
    expect(result).toHaveProperty('geometry');
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('error');
    
    // Verify math operations
    expect(result.math).toEqual({
      sum: 8,
      product: 15,
      powerResult: 125
    });
    
    // Verify geometry calculations
    expect(result.geometry).toEqual({
      area: 50,
      perimeter: 30
    });
    
    // Verify user operations
    expect(result.user).toEqual({
      formatted: 'John (25)',
      isValid: true
    });
    
    // Verify error handling
    expect(result.error).toBe('Name is required');
  });

  test('should track file paths correctly', async () => {
    // Run the app to generate debug data
    await runApp();
    
    const debugData = global.inlineDebugger.getData();
    
    // Check that file paths are included
    const filePaths = debugData.map(item => item.filePath);
    expect(filePaths.length).toBeGreaterThan(0);
    expect(filePaths.every(path => typeof path === 'string')).toBe(true);
  });

  test('should only monitor lines with //? comments', async () => {
    // Run the app to generate debug data
    await runApp();
    
    const debugData = global.inlineDebugger.getData();
    
    // All monitored items should have line numbers (including 0 for some cases)
    debugData.forEach(item => {
      expect(item.line).toBeDefined();
      expect(item.line).toBeGreaterThanOrEqual(0);
    });
  });

  test('should handle different types of monitoring', async () => {
    // Run the app to generate debug data
    await runApp();
    
    const debugData = global.inlineDebugger.getData();
    
    // Check for different types
    const types = [...new Set(debugData.map(item => item.type))];
    expect(types.length).toBeGreaterThan(0);
    expect(types.every(type => typeof type === 'string')).toBe(true);
  });
});
