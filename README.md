# ✨ AI Suggestion Editor

A rich-text editor built with **Tiptap** and **ProseMirror** that integrates AI-powered writing improvements with a tracked-changes workflow — similar to Google Docs' "Suggest edits" mode.

<img src="/screenshot1.png" alt="Screenshot of the AI Suggestion Editor">

---

## What It Does

The AI Suggestion Editor lets users write and edit text, then request AI improvements on selected passages. Instead of silently overwriting content, the AI's proposed changes are shown inline as **suggestions** — highlighted in the document — which the user can **accept** or **reject** one by one.

---

## Features

### ✍️ Rich Text Editing
- Full rich-text editing via [Tiptap](https://tiptap.dev/) (built on ProseMirror)
- Supports **bold**, **italic**, **strikethrough**, headings, and more
- Live **word count** displayed in the status bar

### 🤖 AI Writing Improvement
- Select any passage of text and click **"Improve with AI"** in the bubble menu
- The AI rewrites the selected text and inserts it as a tracked suggestion
- Powered by a pluggable `improveWriting` service (swap in any LLM backend)

### 🔍 Tracked Changes (Suggest Mode)
- Uses [`@handlewithcare/prosemirror-suggest-changes`](https://github.com/handlewithcare/prosemirror-suggest-changes) to manage suggestion marks
- Three suggestion mark types are supported:
  - `insertion` — new content added
  - `deletion` — content removed
  - `modification` — content replaced
- Suggestions are stored as ProseMirror marks with a unique `id`, `user`, and `createdAt` timestamp

### 💬 Context-Aware Bubble Menus
Two separate bubble menus appear depending on what is selected:

| Selection context | Menu shown |
|---|---|
| Regular text selected | **Main menu** — bold, italic, "Improve with AI" |
| Text with a pending suggestion | **Suggestion menu** — Accept ✓ / Reject ✗ |

The menus are mutually exclusive: the suggestion menu takes priority whenever the cursor overlaps a pending change.

### ✅ Accept / Reject Suggestions
- **Accept** — applies the suggestion, permanently replacing the original text
- **Reject** — reverts the suggestion, restoring the original text
- The status bar shows the count of **pending suggestions** at all times

---

## Architecture

```
TiptapEditor
├── extensions/
│   └── SuggestionExtension       # Registers the ProseMirror suggest-changes plugin
│       ├── suggestChanges()      # Core ProseMirror plugin
│       ├── Insertion mark        # Tiptap Mark for inserted text
│       ├── Deletion mark         # Tiptap Mark for deleted text
│       └── Modification mark     # Tiptap Mark for replaced text
│
├── BubbleMenu (main)             # Bold / Italic / Improve with AI
├── SuggestionBubbleMenu          # Accept / Reject for pending suggestions
│
└── aiService.ts                  # improveWriting(text) → Promise<string>
```

### Key Implementation Details

- **`withSuggestChanges`** wraps Tiptap's `dispatchTransaction` so every editor transaction passes through the suggest-changes plugin, ensuring insertions and deletions are automatically marked.
- **`getChangesFromState(state)`** walks the ProseMirror document and collects all active suggestion marks with their positions. This is called directly from `state` (not a cache) so bubble menus always reflect the latest document.
- **`enableSuggestChanges`** is called on editor creation and before AI insertion to ensure suggest mode is active.
- Both bubble menus read from `state` directly to avoid stale cache issues — critical for correct `shouldShow` behavior immediately after AI text insertion.

---

## Tech Stack

| Package | Purpose |
|---|---|
| `@tiptap/react` | React wrapper for the Tiptap editor |
| `@tiptap/starter-kit` | Bundled common extensions (bold, italic, headings, etc.) |
| `@tiptap/extension-placeholder` | Placeholder text when editor is empty |
| `@tiptap/extension-character-count` | Word/character count |
| `@handlewithcare/prosemirror-suggest-changes` | Tracked changes plugin |
| `motion/react` | Animations (e.g. spinning sparkle icon during AI call) |
| `lucide-react` | Icons |
| `shadcn/ui` | Button and Tooltip components |

---

## Getting Started

### Prerequisites
- Node.js 18+
- An AI backend implementing `improveWriting(text: string): Promise<string>` in `src/services/aiService.ts`

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

### Swap in Your AI Model

Edit `src/services/aiService.ts` to call your preferred LLM (OpenAI, Anthropic, local model, etc.):

```ts
export async function improveWriting(text: string): Promise<string> {
  // Call your API here and return the improved string
}
```



 