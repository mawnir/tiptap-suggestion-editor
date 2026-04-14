import { Extension, Mark, mergeAttributes } from '@tiptap/core';
import { suggestChanges, suggestChangesKey, enableSuggestChanges } from '@handlewithcare/prosemirror-suggest-changes';

interface SuggestionChange {
  id: string | number;
  from: number;
  to: number;
  type: 'insertion' | 'deletion' | 'modification';
}

export function getChangesFromState(state: any): SuggestionChange[] {
  const changes: SuggestionChange[] = [];
  const { doc, schema } = state;

  const insertionType = schema.marks.insertion;
  const deletionType = schema.marks.deletion;
  const modType = schema.marks.modification;

  if (!insertionType && !deletionType && !modType) return [];

  doc.descendants((node: any, pos: number) => {
    if (!node.isInline) return true;

    for (const mark of node.marks) {
      const type =
        insertionType && mark.type === insertionType ? 'insertion' :
          deletionType && mark.type === deletionType ? 'deletion' :
            modType && mark.type === modType ? 'modification' :
              null;

      if (type && mark.attrs.id != null) {
        const existing = changes.find(c => c.id === mark.attrs.id);
        if (existing) {
          existing.to = pos + node.nodeSize;
        } else {
          changes.push({ id: mark.attrs.id, from: pos, to: pos + node.nodeSize, type });
        }
      }
    }
    return true;
  });

  return changes;
}

export const SuggestionExtension = Extension.create({
  name: 'suggestion',

  addProseMirrorPlugins() {
    return [suggestChanges()];
  },

  // onCreate() {
  //   const editor = (this as any).editor;
  //   if (editor?.state && editor?.view) {
  //     enableSuggestChanges(editor.state, editor.view.dispatch);
  //   }
  // },

  addStorage() {
    const extension = this;
    return {
      getChanges: (): SuggestionChange[] => {
        const editor = (extension as any).editor;
        if (!editor?.state) return [];
        return getChangesFromState(editor.state);
      },
    };
  },

  addExtensions() {
    const Insertion = Mark.create({
      name: 'insertion',
      addAttributes() {
        return {
          id: { default: null },
          user: { default: null },
          createdAt: { default: null },
        };
      },
      parseHTML() { return [{ tag: 'span.insertion' }]; },
      renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'insertion' }), 0];
      },
    });

    const Deletion = Mark.create({
      name: 'deletion',
      addAttributes() {
        return {
          id: { default: null },
          user: { default: null },
          createdAt: { default: null },
        };
      },
      parseHTML() { return [{ tag: 'span.deletion' }]; },
      renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'deletion' }), 0];
      },
    });

    const Modification = Mark.create({
      name: 'modification',
      addAttributes() {
        return {
          id: { default: null },
          user: { default: null },
          createdAt: { default: null },
        };
      },
      parseHTML() { return [{ tag: 'span.modification' }]; },
      renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { class: 'modification' }), 0];
      },
    });

    return [Insertion, Deletion, Modification];
  },
});