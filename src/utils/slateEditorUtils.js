// src/utils/slateEditorUtils.js (Create a new file for utility functions)
import { Editor, Transforms, Text } from "slate";

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

export const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// Example for checking block type (useful for headings, lists etc.)
export const isBlockActive = (editor, format) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Editor.nodes(editor, {
    at: Editor.unhangRange(editor, selection),
    match: (n) => !Editor.isEditor(n) && n.type === format,
  });

  return !!match;
};

// Add more functions here for toggling block types (headings, lists, etc.) later
// e.g., toggleBlock(editor, format)
