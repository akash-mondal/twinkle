'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Copy, Check, Loader2, Code, FileText, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { generatePaywallId, useCreatePaywall } from '@/hooks/usePaywall';
import { createPaste } from '@/hooks/usePastes';
import dynamic from 'next/dynamic';

// Dynamically import CodeMirror to avoid SSR issues
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg" /> }
);

// Import a proper light theme for better visibility
const loadEditorTheme = async () => {
  const { githubLight } = await import('@uiw/codemirror-theme-github');
  return githubLight;
};

// Language extensions - dynamically imported
const loadLanguage = async (lang: string) => {
  switch (lang) {
    case 'javascript':
    case 'typescript':
      const js = await import('@codemirror/lang-javascript');
      return lang === 'typescript' ? js.javascript({ typescript: true }) : js.javascript();
    case 'python':
      const py = await import('@codemirror/lang-python');
      return py.python();
    case 'html':
      const html = await import('@codemirror/lang-html');
      return html.html();
    case 'css':
      const css = await import('@codemirror/lang-css');
      return css.css();
    case 'json':
      const json = await import('@codemirror/lang-json');
      return json.json();
    case 'markdown':
      const md = await import('@codemirror/lang-markdown');
      return md.markdown();
    default:
      return null;
  }
};

// Markdown preview component
const MarkdownPreview = dynamic(
  () => import('react-markdown').then((mod) => {
    const ReactMarkdown = mod.default;
    return function Preview({ content }: { content: string }) {
      return (
        <div className="prose prose-sm max-w-none p-4 bg-white rounded-lg border border-[var(--unlock-border)] h-[400px] overflow-auto">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-50 animate-pulse rounded-lg" /> }
);

const CONTENT_TYPES = [
  { value: 'plain', label: 'Plain Text', icon: FileText },
  { value: 'javascript', label: 'JavaScript', icon: Code },
  { value: 'typescript', label: 'TypeScript', icon: Code },
  { value: 'python', label: 'Python', icon: Code },
  { value: 'html', label: 'HTML', icon: Code },
  { value: 'css', label: 'CSS', icon: Code },
  { value: 'json', label: 'JSON', icon: Code },
  { value: 'markdown', label: 'Markdown', icon: FileText },
];

export default function UnlockNewPage() {
  const { address, isConnected } = useAccount();
  const { createPaywall, isPending, isConfirming, isSuccess, error } = useCreatePaywall();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('0.10');
  const [contentType, setContentType] = useState('plain');
  const [showPreview, setShowPreview] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [languageExt, setLanguageExt] = useState<any>(null);
  const [shortId, setShortId] = useState('');
  const [fullId, setFullId] = useState<`0x${string}` | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editorTheme, setEditorTheme] = useState<any>(null);

  // Load editor theme
  useEffect(() => {
    loadEditorTheme().then(setEditorTheme);
  }, []);

  // Load language extension when content type changes
  useEffect(() => {
    if (contentType !== 'plain') {
      loadLanguage(contentType).then(setLanguageExt);
    } else {
      setLanguageExt(null);
    }
  }, [contentType]);

  // Auto-detect content type
  const detectContentType = useCallback((text: string) => {
    if (!text.trim()) return;

    // Simple detection based on content patterns
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        JSON.parse(text);
        setContentType('json');
        return;
      } catch {}
    }
    if (text.includes('<!DOCTYPE') || text.includes('<html') || /<[a-z][\s\S]*>/i.test(text)) {
      setContentType('html');
      return;
    }
    if (text.includes('def ') || text.includes('import ') && text.includes(':')) {
      setContentType('python');
      return;
    }
    if (text.includes('function') || text.includes('const ') || text.includes('let ') || text.includes('=>')) {
      if (text.includes(': ') && (text.includes('interface ') || text.includes('type '))) {
        setContentType('typescript');
      } else {
        setContentType('javascript');
      }
      return;
    }
    if (text.includes('# ') || text.includes('## ') || text.includes('**') || text.includes('```')) {
      setContentType('markdown');
      return;
    }
  }, []);

  // Character count
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.split('\n').length;

  // Handle create
  const handleCreate = async () => {
    if (!content.trim()) {
      setSaveError('Please enter some content');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setSaveError('Please set a valid price');
      return;
    }
    if (!address) {
      setSaveError('Please connect your wallet first');
      return;
    }

    setSaveError(null);
    const { shortId: newShortId, fullId: newFullId } = generatePaywallId();
    setShortId(newShortId);
    setFullId(newFullId);

    try {
      // Save to server first (include content type for proper rendering)
      await createPaste({
        id: newShortId,
        content,
        title: title || 'Untitled',
        price,
        creator: address,
        contentType,
      });

      // Then create on-chain paywall
      await createPaywall(newFullId, price);
    } catch (e: any) {
      if (e.message?.includes('User rejected')) {
        setSaveError('Transaction cancelled. Please try again.');
      } else if (e.message?.includes('insufficient funds')) {
        setSaveError('Insufficient ETH for gas fees.');
      } else {
        setSaveError(e.message || 'Failed to create paste. Check console for details.');
      }
    }
  };

  // Show success when confirmed
  useEffect(() => {
    if (isSuccess && shortId) {
      setShowSuccess(true);
    }
  }, [isSuccess, shortId]);

  // Copy link
  const copyLink = () => {
    const link = `${window.location.origin}/apps/unlock/${shortId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const link = shortId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apps/unlock/${shortId}` : '';
  const selectedType = CONTENT_TYPES.find(t => t.value === contentType) || CONTENT_TYPES[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {!showSuccess ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Title */}
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 mb-4 bg-white border border-[var(--unlock-border)] rounded-lg text-[var(--unlock-text)] placeholder:text-[var(--unlock-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unlock-accent)]/30"
              style={{ fontFamily: 'var(--font-unlock-heading)' }}
            />

            {/* Editor Toolbar */}
            <div className="flex items-center gap-2 mb-2">
              {/* Content Type Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-[var(--unlock-border)] rounded-lg text-sm text-[var(--unlock-text)] hover:bg-[var(--unlock-bg-dark)] transition-colors"
                >
                  <selectedType.icon className="w-4 h-4" />
                  {selectedType.label}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showTypeDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[var(--unlock-border)] rounded-lg shadow-lg z-10">
                    {CONTENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setContentType(type.value);
                          setShowTypeDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--unlock-bg-dark)] transition-colors ${
                          contentType === type.value ? 'bg-[var(--unlock-bg-dark)] text-[var(--unlock-accent)]' : 'text-[var(--unlock-text)]'
                        }`}
                      >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Auto-detect button */}
              <button
                onClick={() => detectContentType(content)}
                className="px-3 py-2 text-sm text-[var(--unlock-muted)] hover:text-[var(--unlock-text)] transition-colors"
              >
                Auto-detect
              </button>

              <div className="flex-1" />

              {/* Markdown Preview Toggle */}
              {contentType === 'markdown' && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    showPreview
                      ? 'bg-[var(--unlock-accent)] text-white'
                      : 'bg-white border border-[var(--unlock-border)] text-[var(--unlock-text)] hover:bg-[var(--unlock-bg-dark)]'
                  }`}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-[var(--unlock-muted)]">
                <span>{lineCount} lines</span>
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
              </div>
            </div>

            {/* Editor */}
            <div className="relative">
              {showPreview && contentType === 'markdown' ? (
                <MarkdownPreview content={content} />
              ) : contentType === 'plain' ? (
                <textarea
                  placeholder="Paste your content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[400px] px-4 py-4 bg-white border border-[var(--unlock-border)] rounded-lg text-[var(--unlock-text)] placeholder:text-[var(--unlock-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--unlock-accent)]/30 resize-none"
                  style={{ fontFamily: 'var(--font-unlock-mono)', fontSize: '14px', lineHeight: '1.6' }}
                />
              ) : (
                <CodeMirror
                  value={content}
                  height="400px"
                  extensions={languageExt ? [languageExt] : []}
                  onChange={(value) => setContent(value)}
                  placeholder="Paste your code here..."
                  className="border border-[var(--unlock-border)] rounded-lg overflow-hidden [&_.cm-content]:text-[#1a1a1a] [&_.cm-line]:text-[#1a1a1a]"
                  theme={editorTheme || 'light'}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightSpecialChars: true,
                    foldGutter: true,
                    drawSelection: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    rectangularSelection: true,
                    crosshairCursor: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    closeBracketsKeymap: true,
                    searchKeymap: true,
                    foldKeymap: true,
                    completionKeymap: true,
                    lintKeymap: true,
                  }}
                />
              )}
            </div>

            {/* Price + Create */}
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-[var(--unlock-muted)]">Price:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-24 px-3 py-2 bg-white border border-[var(--unlock-border)] rounded-lg text-[var(--unlock-text)] focus:outline-none focus:ring-2 focus:ring-[var(--unlock-accent)]/30"
                />
                <span className="text-sm font-medium text-[#E78B1F]">MNEE</span>
              </div>

              <div className="flex-1" />

              {!isConnected ? (
                <ConnectButton label="Connect to Create" />
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={!content.trim() || isPending || isConfirming}
                  className="px-6 py-3 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(isPending || isConfirming) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? 'Confirm in wallet...' : isConfirming ? 'Creating...' : 'Create Paste'}
                </button>
              )}
            </div>

            {(error || saveError) && (
              <p className="mt-4 text-sm text-red-500">{error?.message || saveError}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-green-600" />
            </motion.div>

            <h2
              className="text-3xl font-bold text-[var(--unlock-text)] mb-2"
              style={{ fontFamily: 'var(--font-unlock-heading)' }}
            >
              Paste Created!
            </h2>
            <p className="text-[var(--unlock-muted)] mb-8">
              Share this link to get paid {price} MNEE per unlock
            </p>

            {/* Link box */}
            <div className="max-w-md mx-auto bg-white border border-[var(--unlock-border)] rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <code
                  className="flex-1 text-sm text-[var(--unlock-text)] truncate"
                  style={{ fontFamily: 'var(--font-unlock-mono)' }}
                >
                  {link}
                </code>
                <button
                  onClick={copyLink}
                  className="p-2 hover:bg-[var(--unlock-bg-dark)] rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-[var(--unlock-muted)]" />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
              <a
                href={`/apps/unlock/${shortId}`}
                className="px-6 py-3 bg-[var(--unlock-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                View Paste
              </a>
              <a
                href="/apps/unlock/new"
                className="px-6 py-3 border border-[var(--unlock-border)] text-[var(--unlock-text)] rounded-lg font-medium hover:bg-[var(--unlock-bg-dark)] transition-colors"
              >
                Create Another
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
