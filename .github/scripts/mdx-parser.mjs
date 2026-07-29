/**
 * MDX Fenced Code Block Parser
 *
 * Provides a state machine that tracks whether a given line in an MDX file
 * is inside a fenced code block (documentation context) or outside it
 * (executable context). Only lines in executable context should be scanned
 * for security violations.
 */

/**
 * Parses MDX file content and returns an array of objects indicating
 * which lines are executable (outside fenced code blocks).
 *
 * @param {string} content - The full text content of an MDX file
 * @returns {{ lineNumber: number, text: string, executable: boolean }[]}
 */
export function parseMdxLines(content) {
  const lines = content.split('\n');
  const result = [];
  let inFencedBlock = false;
  let fenceChar = null;
  let fenceLength = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (inFencedBlock) {
      const closeMatch = trimmed.match(/^(`{3,}|~{3,})\s*$/);
      if (
        closeMatch &&
        closeMatch[1][0] === fenceChar &&
        closeMatch[1].length >= fenceLength
      ) {
        result.push({ lineNumber: i + 1, text: line, executable: false });
        inFencedBlock = false;
        fenceChar = null;
        fenceLength = 0;
      } else {
        result.push({ lineNumber: i + 1, text: line, executable: false });
      }
    } else {
      const openMatch = trimmed.match(/^(`{3,}|~{3,})/);
      if (openMatch) {
        inFencedBlock = true;
        fenceChar = openMatch[1][0];
        fenceLength = openMatch[1].length;
        result.push({ lineNumber: i + 1, text: line, executable: false });
      } else {
        result.push({ lineNumber: i + 1, text: line, executable: true });
      }
    }
  }

  return result;
}

/**
 * Returns only the executable (non-fenced-block) lines from an MDX file.
 *
 * @param {string} content - The full text content of an MDX file
 * @returns {{ lineNumber: number, text: string }[]}
 */
export function getExecutableLines(content) {
  return parseMdxLines(content)
    .filter((line) => line.executable)
    .map(({ lineNumber, text }) => ({ lineNumber, text }));
}
