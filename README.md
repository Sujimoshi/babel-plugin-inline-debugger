# Inline Debugger

A powerful Babel plugin for selective expression monitoring and debugging in JavaScript/TypeScript projects. Only monitors lines marked with `//?` comments, making it perfect for development, testing, and debugging workflows.

## 🚀 Features

- 🔍 **Selective Expression Monitoring** - Only monitors lines marked with `//?` comments
- 📊 **Variable Tracking** - Captures variable assignments and their values
- 📝 **Console Log Wrapping** - Monitors console.log, console.error, etc.
- ⚡ **Async Support** - Handles async/await expressions
- 🧪 **Jest Integration** - Works seamlessly with Jest tests
- 🎯 **Precise Control** - Only transform what you explicitly mark for monitoring
- 📁 **Multi-File Support** - Tracks file paths for monitoring across multiple files
- 🔗 **Project-Wide Monitoring** - Perfect for large projects with many files

## 📦 Installation

```bash
npm install --save-dev inline-debugger
```

## 🛠️ Quick Start

### 1. Basic Usage

```javascript
// Mark lines you want to monitor with //?
let name = 'John'; //?
let age = 30;
let isAdult = age >= 18; //?

console.log('Name:', name); //?
console.log('Age:', age); // → not monitored
```

### 2. Babel Configuration

Create a `.babelrc` or `babel.config.js`:

```javascript
module.exports = {
  plugins: [
    ['inline-debugger', {
      enableDebugger: true,
      outputFile: '.debug.data.json'
    }]
  ],
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ]
};
```

### 3. Runtime Auto-Initialization

The runtime automatically initializes with default settings. No manual setup required!

```javascript
// Runtime auto-initializes with default output file: '.debug.data.json'
// No manual initialization needed!
```

## 🏗️ Class-Based Architecture

The runtime is built using a modern class-based approach:

```javascript
const { InlineDebuggerRuntime } = require('inline-debugger/src/runtime.js');

// Create a custom runtime instance
const customRuntime = new InlineDebuggerRuntime({
  outputFile: 'custom-debug.json'
});

// Use the instance methods
customRuntime.setupGlobals();
```

**Benefits:**
- ✅ **Encapsulation**: All functionality contained within the class
- ✅ **Reusability**: Create multiple runtime instances
- ✅ **Maintainability**: Clean, organized code structure
- ✅ **Extensibility**: Easy to extend and customize

## 🎯 Selective Monitoring

The plugin only transforms and monitors lines marked with `//?` comments:

### Variable Assignments
```javascript
let x = 5; //? → monitored
let y = x + 3; // → not monitored
```

### Expressions
```javascript
2 + 3; //? → monitored
Math.sqrt(16); // → not monitored
```

### Console Calls
```javascript
console.log('hello'); //? → monitored
console.error('err'); // → not monitored
```

### Async Operations
```javascript
await fetchData(); //? → monitored
```

## 📁 Multi-File Support

The plugin automatically tracks file paths, making it perfect for large projects:

```javascript
// user.js
let name = 'John'; //? → monitored

// math.js  
let result = 2 + 3; //? → monitored
```

### Output with File Paths
```
📁 user.js:
──────────
  1. name = John (line 2)

📁 math.js:
──────────
  1. result = 5 (line 2)
```

## 🧪 Jest Integration

### 1. Install Dependencies
```bash
npm install --save-dev jest babel-jest @babel/preset-env @babel/preset-typescript
```

### 2. Configure Jest (`jest.config.js`)
```javascript
module.exports = {
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      {
        plugins: [
          [
            'inline-debugger',
            {
              enableDebugger: true,
              outputFile: '.debug.data.json',
            },
          ],
        ],
        presets: [['@babel/preset-env', { targets: { node: 'current' } }], '@babel/preset-typescript'],
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

### 3. Setup Jest (`jest.setup.js`)
```javascript
// Runtime auto-initializes and sets up globals when required
require('inline-debugger/src/runtime.js');

// Clean up after each test
afterEach(() => {
  global.debugger.clearData();
});
```

### 4. Use in Tests
```javascript
describe('My Tests', () => {
  test('should monitor expressions', () => {
    let result = 2 + 3; //? → monitored
    let power = Math.pow(2, 3); // → not monitored
    console.log('Result:', result); //? → monitored
    
    expect(result).toBe(5);
    expect(power).toBe(8);
    
    // Print debug results
    global.debugger.printData();
  });
});
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableDebugger` | boolean | `true` | Enable/disable debugger monitoring |
| `outputFile` | string | `'.debug.data.json'` | Output file for debug data |

## 📊 Output Format

The plugin generates a `.debug.data.json` file with monitoring data:

```json
[
  {
    "type": "variable",
    "variable": "name",
    "called": "John",
    "line": 3,
    "filePath": "/src/user.js"
  },
  {
    "type": "expression",
    "called": "5",
    "line": 5,
    "filePath": "/src/math.js"
  },
  {
    "type": "log",
    "called": ["Name:", "John"],
    "line": 7,
    "filePath": "/src/user.js"
  }
]
```

## 🔧 API Reference

### Runtime Functions

#### `InlineDebuggerRuntime` (Class)
The main runtime class that handles all monitoring functionality.

**Constructor:**
- `new InlineDebuggerRuntime(options)` - Create a new runtime instance

**Methods:**
- `initialize(options)` - Initialize the runtime with custom options
- `setupGlobals()` - Setup global utilities for testing environments
- `inlineDebuggerWatch(data)` - Main monitoring function
- `debugLog(logFn, data)` - Console log wrapper

#### `initializeRuntime(options)` (Optional)
Manually initialize the debugger runtime with custom options.

**Parameters:**
- `options.outputFile` - Output file path (default: '.debug.data.json')

#### `setupGlobals()` (Automatic)
Setup global utilities for testing environments. This function is called automatically when requiring the runtime:
- Auto-initializes the runtime if not already initialized
- Makes `inlineDebuggerWatch` and `debugLog` available globally
- Creates `global.debugger` with utility functions for testing

#### `inlineDebuggerWatch(data)`
Main monitoring function (automatically injected).

**Parameters:**
- `data.type` - Type of monitoring ('variable', 'expression', 'log', 'error')
- `data.variable` - Variable name (for variables)
- `data.called` - Function to execute
- `data.line` - Line number
- `data.filePath` - Source file path

#### `debugLog(logFn, data)`
Console log wrapper (automatically injected).

### Global Utilities (Jest)

#### `global.debugger.getData()`
Get current debug data.

#### `global.debugger.clearData()`
Clear debug data.

#### `global.debugger.printData()`
Print debug data in readable format.

## 🎯 Use Cases

### Development
- **Debug complex expressions** - See intermediate values
- **Understand code flow** - Track variable changes
- **Performance analysis** - Monitor expensive operations

### Testing
- **Test debugging** - See what's happening in tests
- **Assertion debugging** - Understand why tests fail
- **Integration testing** - Monitor cross-file interactions

### Education
- **Learning JavaScript** - See how expressions evaluate
- **Code reviews** - Understand complex logic
- **Documentation** - Live examples of code execution

## 🚀 Advanced Usage

### Custom Monitoring
```javascript
// You can manually call the monitoring functions
inlineDebuggerWatch({
  type: 'expression',
  called: () => someComplexCalculation(),
  line: 42,
  hide: false
});
```

### Error Handling
```javascript
try {
  riskyOperation(); //?
} catch (error) {
  // Error is automatically captured and logged
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Plugin not transforming code**
   - Ensure the plugin is properly configured in your Babel config
   - Check that the file extensions match your test files

2. **No output data**
   - Verify that `initializeRuntime()` is called
   - Check that the output file path is correct

3. **Missing file paths**
   - Ensure Babel is configured with proper filename options
   - Check that the plugin is receiving file information

### Debug Mode

Enable debug logging:

```javascript
// In your setup file
process.env.DEBUG = 'inline-debugger';
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Inline Debugger** - Making debugging easier, one expression at a time! 🐛✨
