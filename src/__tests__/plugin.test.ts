import { transformSync } from "@babel/core";

const transpile = (code: string) => {
  const result = transformSync(code, {
    filename: "test.ts",
    presets: [
      ["@babel/preset-env", { targets: { node: "current" } }],
      "@babel/preset-typescript",
    ],
    plugins: ["dist/babel-plugin-inline-debugger.js"],
  });

  return result?.code || "";
};

describe("Babel Plugin", () => {
  test("should transform code and insert monitoring statements", async () => {
    expect(
  transpile(`
      const a = 5; //?
      const b = 3;
      const sum = a + b;
      console.log(sum);
    `)
).toMatchInlineSnapshot(`
""use strict";

const a = (inlineDebuggerWatch({
  type: "variable",
  filePath: "/Users/isolomakha/Projects/inline-debugger/test.ts",
  line: 2,
  called: () => {
    return 5;
  },
  variable: "a"
}), 5); //?
const b = (inlineDebuggerWatch({
  type: "variable",
  filePath: "/Users/isolomakha/Projects/inline-debugger/test.ts",
  line: 3,
  called: () => {
    return 3;
  },
  variable: "b"
}), 3);
const sum = a + b;
console.log(sum);"
`);
  });
});
