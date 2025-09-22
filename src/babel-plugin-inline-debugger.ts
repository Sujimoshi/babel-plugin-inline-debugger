import { PluginObj, PluginPass } from "@babel/core";
import * as t from "@babel/types";

/**
 * Babel plugin for inline debugging
 * Transforms code to add monitoring capabilities
 */
export default function babelPluginInlineDebugger(
  babel: any
): PluginObj<PluginPass> {
  const { types: t } = babel;

  // Check environment variable to enable/disable debugger
  const enableDebugger = process.env["INLINE_DEBUGGER_ENABLED"] !== "false";

  if (!enableDebugger) {
    return {
      name: "babel-plugin-inline-debugger",
      visitor: {},
    };
  }

  /**
   * Check if a line has worksheet comment
   */
  function hasWorksheetComment(path: any): boolean {
    // Check the current node's comments
    const leadingComments = path.node.leadingComments || [];
    const trailingComments = path.node.trailingComments || [];
    const allComments = [...leadingComments, ...trailingComments];

    // Check parent node's comments (VariableDeclaration for VariableDeclarator)
    let parentComments: any[] = [];
    if (path.parent) {
      parentComments = [
        ...(path.parent.leadingComments || []),
        ...(path.parent.trailingComments || []),
      ];
    }

    const allNodeComments = [...allComments, ...parentComments];
    const hasComment = allNodeComments.some((comment: any) =>
      comment.value.startsWith("?")
    );
    return hasComment;
  }

  /**
   * Get file path from Babel path
   */
  function getFilePath(path: any): string {
    return path.hub?.file?.opts?.filename || "unknown";
  }

  /**
   * Create watch call
   */
  function createWatchCall(
    path: any,
    type: string,
    variable?: string
  ): t.CallExpression {
    const filePath = getFilePath(path);
    const line = path.node.loc?.start?.line || 0;

    const watchObject: t.ObjectExpression = {
      type: "ObjectExpression",
      properties: [
        t.objectProperty(t.identifier("type"), t.stringLiteral(type)),
        t.objectProperty(t.identifier("filePath"), t.stringLiteral(filePath)),
        t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
        t.objectProperty(
          t.identifier("called"),
          t.arrowFunctionExpression([], t.blockStatement([]))
        ),
      ],
    };

    if (variable) {
      watchObject.properties.push(
        t.objectProperty(t.identifier("variable"), t.stringLiteral(variable))
      );
    }

    return t.callExpression(t.identifier("inlineDebuggerWatch"), [watchObject]);
  }

  /**
   * Wrap with log
   */
  function wrapWithLog(
    path: any,
    logFn: t.Identifier,
    args: t.Expression[]
  ): void {
    const filePath = getFilePath(path);
    const line = path.node.loc?.start?.line || 0;

    const mylogCall = t.callExpression(t.identifier("debugLog"), [
      logFn,
      t.objectExpression([
        t.objectProperty(t.identifier("type"), t.stringLiteral("log")),
        t.objectProperty(t.identifier("filePath"), t.stringLiteral(filePath)),
        t.objectProperty(t.identifier("line"), t.numericLiteral(line)),
        t.objectProperty(t.identifier("called"), t.arrayExpression(args)),
      ]),
    ]);

    path.replaceWith(mylogCall);
  }

  return {
    name: "babel-plugin-inline-debugger",
    visitor: {
      // Variable declarations
      VariableDeclarator(path: any) {
        if (!hasWorksheetComment(path)) return;
        if (!t.isIdentifier(path.node.id)) return;

        const variableName = path.node.id.name;
        const init = path.node.init;

        if (init) {
          const watchCall = createWatchCall(path, "variable", variableName);
          const watchObject = watchCall.arguments[0] as t.ObjectExpression;
          const calledProperty = watchObject.properties[3] as t.ObjectProperty;
          calledProperty.value = t.arrowFunctionExpression(
            [],
            t.blockStatement([t.returnStatement(init)])
          );

          path.node.init = t.sequenceExpression([watchCall, init]);
        }
      },

      // Expression statements
      ExpressionStatement(path: any) {
        if (!hasWorksheetComment(path)) return;
        if (t.isCallExpression(path.node.expression)) return;

        const expression = path.node.expression;
        const watchCall = createWatchCall(path, "expression");
        const watchObject = watchCall.arguments[0] as t.ObjectExpression;
        const calledProperty = watchObject.properties[3] as t.ObjectProperty;
        calledProperty.value = t.arrowFunctionExpression(
          [],
          t.blockStatement([t.returnStatement(expression)])
        );

        path.replaceWith(
          t.expressionStatement(t.sequenceExpression([watchCall, expression]))
        );
      },

      // Console.log statements
      CallExpression(path: any) {
        if (!hasWorksheetComment(path)) return;
        if (!t.isMemberExpression(path.node.callee)) return;
        if (!t.isIdentifier(path.node.callee.object, { name: "console" }))
          return;
        if (!t.isIdentifier(path.node.callee.property)) return;

        const logMethod = path.node.callee.property.name;
        const logFn = t.identifier(`console.${logMethod}`);
        const args = path.node.arguments as t.Expression[];

        wrapWithLog(path, logFn, args);
      },

      // Await expressions
      AwaitExpression(path: any) {
        if (!hasWorksheetComment(path)) return;

        const argument = path.node.argument;
        const watchCall = createWatchCall(path, "await");
        const watchObject = watchCall.arguments[0] as t.ObjectExpression;
        const calledProperty = watchObject.properties[3] as t.ObjectProperty;
        calledProperty.value = t.arrowFunctionExpression(
          [],
          t.blockStatement([t.returnStatement(argument)])
        );

        path.replaceWith(
          t.sequenceExpression([watchCall, t.awaitExpression(argument)])
        );
      },

      // Throw statements
      ThrowStatement(path: any) {
        if (!hasWorksheetComment(path)) return;

        const argument = path.node.argument;
        const watchCall = createWatchCall(path, "throw");
        const watchObject = watchCall.arguments[0] as t.ObjectExpression;
        const calledProperty = watchObject.properties[3] as t.ObjectProperty;
        calledProperty.value = t.arrowFunctionExpression(
          [],
          t.blockStatement([t.returnStatement(argument)])
        );

        // For throw statements, we need to wrap in a block statement
        path.replaceWith(
          t.blockStatement([
            t.expressionStatement(watchCall),
            t.throwStatement(argument),
          ])
        );
      },

      // Return statements
      ReturnStatement(path: any) {
        if (!hasWorksheetComment(path)) return;
        if (!path.node.argument) return;

        const argument = path.node.argument;
        const watchCall = createWatchCall(path, "return");
        const watchObject = watchCall.arguments[0] as t.ObjectExpression;
        const calledProperty = watchObject.properties[3] as t.ObjectProperty;
        calledProperty.value = t.arrowFunctionExpression(
          [],
          t.blockStatement([t.returnStatement(argument)])
        );

        path.node.argument = t.sequenceExpression([watchCall, argument]);
      },

      // Function declarations
      FunctionDeclaration(path: any) {
        if (!hasWorksheetComment(path)) return;

        const functionName = path.node.id?.name || "anonymous";
        const watchCall = createWatchCall(path, "function", functionName);
        const watchObject = watchCall.arguments[0] as t.ObjectExpression;
        const calledProperty = watchObject.properties[3] as t.ObjectProperty;
        calledProperty.value = t.arrowFunctionExpression(
          [],
          t.blockStatement([t.returnStatement(t.identifier(functionName))])
        );

        path.insertBefore(t.expressionStatement(watchCall));
      },

      // Arrow functions
      ArrowFunctionExpression(path: any) {
        if (!hasWorksheetComment(path)) return;

        const watchCall = createWatchCall(path, "arrow");
        const watchObject = watchCall.arguments[0] as t.ObjectExpression;
        const calledProperty = watchObject.properties[3] as t.ObjectProperty;
        calledProperty.value = t.arrowFunctionExpression(
          [],
          t.blockStatement([
            t.returnStatement(
              t.arrowFunctionExpression(path.node.params, path.node.body)
            ),
          ])
        );

        path.replaceWith(t.sequenceExpression([watchCall, path.node]));
      },

      // Class methods
      ClassMethod(path: any) {
        if (!hasWorksheetComment(path)) return;

        const methodName = t.isIdentifier(path.node.key)
          ? path.node.key.name
          : "method";
        const watchCall = createWatchCall(path, "method", methodName);
        const watchObject = watchCall.arguments[0] as t.ObjectExpression;
        const calledProperty = watchObject.properties[3] as t.ObjectProperty;
        calledProperty.value = t.arrowFunctionExpression(
          [],
          t.blockStatement([t.returnStatement(t.identifier(methodName))])
        );

        path.insertBefore(t.expressionStatement(watchCall));
      },

      // Object methods
      ObjectMethod(path: any) {
        if (!hasWorksheetComment(path)) return;

        const methodName = t.isIdentifier(path.node.key)
          ? path.node.key.name
          : "method";
        const watchCall = createWatchCall(path, "objectMethod", methodName);
        const watchObject = watchCall.arguments[0] as t.ObjectExpression;
        const calledProperty = watchObject.properties[3] as t.ObjectProperty;
        calledProperty.value = t.arrowFunctionExpression(
          [],
          t.blockStatement([t.returnStatement(t.identifier(methodName))])
        );

        path.insertBefore(t.expressionStatement(watchCall));
      },
    },
  };
}
