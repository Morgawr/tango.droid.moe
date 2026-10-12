export interface WordItem {
  id: number;
  kind: 'vocab' | 'grammar' | 'highlight';
  createdAt: number;
  dateFormatted: string;
  term: string;
  reading: string;
  pitchAccent?: { downstep?: number; pattern?: string } | null;
  frequencyRank?: number | null;
  definitionText: string;
  definitions: string[];
  sentence: string;
  wordRange?: [number, number] | null;
  tag: string;
  workSlug: string;
  workTitle?: string;
  hasScreenshot: boolean;
  screenshotUrl?: string | null;
  thumbnailUrl?: string | null;
  twitchClipUrl?: string | null;
}

export function formatSentenceHtml(sentence: string, term: string, wordRange?: [number, number] | null): string {
  if (!sentence) return '';
  
  if (wordRange && Array.isArray(wordRange) && wordRange.length === 2) {
    const [start, end] = wordRange;
    if (start >= 0 && end <= sentence.length && start < end) {
      const before = escapeHtml(sentence.slice(0, start));
      const target = escapeHtml(sentence.slice(start, end));
      const after = escapeHtml(sentence.slice(end));
      return `${before}<mark class="bg-transparent text-accent-amber font-semibold border-b border-accent-amber pb-0.5">${target}</mark>${after}`;
    }
  }

  // Fallback to finding term
  const idx = sentence.indexOf(term);
  if (idx !== -1) {
    const before = escapeHtml(sentence.slice(0, idx));
    const target = escapeHtml(term);
    const after = escapeHtml(sentence.slice(idx + term.length));
    return `${before}<mark class="bg-transparent text-accent-amber font-semibold border-b border-accent-amber pb-0.5">${target}</mark>${after}`;
  }

  return escapeHtml(sentence);
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function extractTwitchClipSlug(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/clip\/([A-Za-z0-9_-]+)/) || url.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}
