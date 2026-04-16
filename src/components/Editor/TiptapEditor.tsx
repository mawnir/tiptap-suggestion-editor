import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { getChangesFromState, SuggestionExtension } from './extensions/SuggestionExtension';
import { improveWriting } from '@/src/services/aiService';
import {
  applySuggestion,
  revertSuggestion,
  enableSuggestChanges,
  isSuggestChangesEnabled,
  toggleSuggestChanges,
  disableSuggestChanges,
} from '@handlewithcare/prosemirror-suggest-changes';
import {
  Bold,
  Italic,
  Strikethrough,
  Sparkles,
  Check,
  X,
  Undo,
  Redo,
  Type,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { withSuggestChanges } from '@handlewithcare/prosemirror-suggest-changes';
import { EditorView } from '@tiptap/pm/view';

// We need to import the commands from the plugin

export const TiptapEditor = () => {
  const [isImproving, setIsImproving] = useState(false);
  const isAISuggestion = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing something amazing...',
      }),
      CharacterCount,
      SuggestionExtension,
    ],
    content: `
      <h2>Welcome to the AI Suggestion Editor</h2>
      <p>Try selecting some text and clicking the <strong>Sparkles</strong> icon in the bubble menu to see AI suggestions in action!</p>
      <p>You can accept or reject changes just like in Google Docs.</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-8',
      },
    },

    onCreate({ editor }) {
      const view = editor.view;
      // Grab Tiptap's own dispatchTransaction (already bound on the view props)
      const tiptapDispatch = view.props.dispatchTransaction!.bind(view);

      editor.view.setProps({
        dispatchTransaction: withSuggestChanges(function (this: EditorView, tr) {
          tiptapDispatch(tr);
        }),
      });
    },
  });

  // 1. Create a helper function to simulate the stream
async function* mockStreamGenerator(fullString) {
  const words = fullString.split(" ");
  
  for (const word of words) {
      // Simulate network latency (e.g., 100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Yield an object that mimics the SDK structure
      yield {
          text: () => word + " "
      };
  }
}

  const handleImproveWriting = useCallback(async () => {
    if (!editor || !editor.state) return;

    const { from, to, empty } = editor.state.selection;
    if (empty) return;

    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    setIsImproving(true);

    try {
      //const improvedText = await improveWriting(selectedText);
      //const improvedText = "This is the improved version of the selected text.";

      const improvedText = {
        stream: mockStreamGenerator("This is the improved version of the selected text.")
    };

      enableSuggestChanges(editor.state, editor.view.dispatch);

      isAISuggestion.current = true; // ← set before insert

      // Delete the original selection once, then stream inserts after it.
      editor.chain().focus().deleteRange({ from, to }).run();
 
      // Use direct transactions so we can clear inherited deletion marks.
      const deletionMarkType = editor.state.schema.marks.deletion;
      let pos = to;
      for await (const chunk of improvedText.stream) {
        const chunkText = chunk.text();
        const { state, view } = editor;
        let tr = state.tr;

        if (deletionMarkType) {
          tr = tr.removeStoredMark(deletionMarkType);
        }

        tr = tr.insertText(chunkText, pos, pos);
        view.dispatch(tr);

        // Keep inserting after the last inserted content.
        pos += chunkText.length;
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsImproving(false);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[80vh]">
      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto relative">
        {editor && (
          <BubbleMenu
            editor={editor}
            shouldShow={({ state }) => {
              const { from, to } = state.selection;
              if (from === to) return false;
              const changes = getChangesFromState(state);
              const hasSuggestion = changes.some((c: any) =>
                (from >= c.from && from <= c.to) ||
                (to >= c.from && to <= c.to) ||
                (c.from >= from && c.to <= to)
              );
              if (!hasSuggestion) isAISuggestion.current = false; // ← reset when no suggestion in selection
              return !hasSuggestion;
            }}
          >
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg shadow-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={cn(editor.isActive('bold') && 'bg-slate-100')}
              >
                <Bold className="w-4 h-4" />
              </Button>

              <div className="w-px h-4 bg-slate-200 mx-1" />

              <Button
                variant="default"
                size="sm"
                onClick={handleImproveWriting}
                disabled={isImproving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {isImproving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Improve with AI
              </Button>
            </div>
          </BubbleMenu>
        )}

        {editor && (
          <SuggestionBubbleMenu editor={editor} isAISuggestion={isAISuggestion} />
        )}

        <EditorContent editor={editor} />
      </div>

      {/* Footer / Status Bar */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest font-bold">
        <div>{(editor.storage as any).suggestion?.getChanges()?.length || 0} Pending Suggestions</div>
        <div className="flex items-center gap-4">
          <span>Words: {(editor.storage as any).characterCount?.words?.() || 0}</span>
        </div>
      </div>
    </div>
  );
};

const SuggestionBubbleMenu = ({ editor, isAISuggestion }: { editor: any; isAISuggestion: React.MutableRefObject<boolean>; }) => {
  // Subscribe to editor state updates so the component re-renders on selection change
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate(n => n + 1);
    editor.on('selectionUpdate', handler);
    editor.on('update', handler);
    return () => {
      editor.off('selectionUpdate', handler);
      editor.off('update', handler);
    };
  }, [editor]);

  // Read directly from state, not storage cache
  const changes = getChangesFromState(editor.state);
  const { from, to } = editor.state.selection;

  const currentChange = changes.find((c: any) =>
    (from >= c.from && from <= c.to) ||
    (to >= c.from && to <= c.to) ||
    (c.from >= from && c.to <= to)
  );

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="suggestionBubbleMenu"
      options={{
        //zIndex: 50,
        placement: 'bottom-end',
      }}
      //tippyOptions={{ zIndex: 50, placement: 'top' }}
      shouldShow={({ state }) => {
        if (!isAISuggestion.current) return false; // ← gate here

        // Read fresh from state every time
        const freshChanges = getChangesFromState(state);
        const sel = state.selection;
        return freshChanges.some((c: any) =>
          (sel.from >= c.from && sel.from <= c.to) ||
          (sel.to >= c.from && sel.to <= c.to) ||
          (c.from >= sel.from && c.to <= sel.to)
        );
      }}
    >
      {currentChange && (
        <div className="flex items-center gap-1 p-1 bg-white border border-indigo-100 rounded-lg shadow-xl z-50">
          <div className="flex items-center gap-1 px-2 border-r border-slate-100 mr-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">
              Suggestion
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 gap-1.5"
            onClick={() => {
              // New API: applySuggestion(id, from?, to?) returns a Command
              applySuggestion(currentChange.id, currentChange.from, currentChange.to)(
                editor.state,
                editor.view.dispatch
              );
              isAISuggestion.current = false; // ← reset on accept
              disableSuggestChanges(editor.state, editor.view.dispatch);

              editor.view.focus();
            }}
          >
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Accept</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
            onClick={() => {
              // New API: revertSuggestion(id, from?, to?) returns a Command
              revertSuggestion(currentChange.id, currentChange.from, currentChange.to)(
                editor.state,
                editor.view.dispatch
              );
              isAISuggestion.current = false; // ← reset on accept
              disableSuggestChanges(editor.state, editor.view.dispatch);

              editor.view.focus();
            }}
          >
            <X className="w-4 h-4" />
            <span className="text-xs font-medium">Reject</span>
          </Button>
        </div>
      )}
    </BubbleMenu>
  );
};