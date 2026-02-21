import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";

type Props = {
  value: string;
  onChange: (value: string) => void;
  height?: string;
};

export default function SqlEditor({ value, onChange, height = "200px" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        sql(),
        oneDark,
        EditorView.theme({
          "&": {
            height: "100%",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontSize: "13px",
          },
          ".cm-scroller": {
            overflow: "auto",
          },
          ".cm-content": {
            padding: "10px 12px",
          },
          "&.cm-focused": {
            outline: "none",
            borderColor: "#3b82f6",
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return (
    <div style={{ height }}>
      <div ref={containerRef} />
    </div>
  );
}
