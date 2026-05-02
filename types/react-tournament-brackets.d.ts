declare module "@g-loot/react-tournament-brackets" {
  import * as React from "react";

  export const Match: React.ComponentType<any>;
  export const SVGViewer: React.ComponentType<any>;
  export const SingleEliminationBracket: React.ComponentType<any>;
  export function createTheme(theme: Record<string, unknown>): Record<string, unknown>;
}
