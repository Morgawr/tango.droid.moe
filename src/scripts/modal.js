// Client-side Word Detail Modal Handler

let words = [];
let wordMap = new Map();
let currentWordIndex = -1;
let visibleWordIds = [];

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatSentence(sentence, term, wordRange) {
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
  const idx = sentence.indexOf(term);
  if (idx !== -1) {
    const before = escapeHtml(sentence.slice(0, idx));
    const target = escapeHtml(term);
    const after = escapeHtml(sentence.slice(idx + term.length));
    return `${before}<mark class="bg-transparent text-accent-amber font-semibold border-b border-accent-amber pb-0.5">${target}</mark>${after}`;
  }
  return escapeHtml(sentence);
}

function extractClipSlug(url) {
  if (!url) return null;
  const match = url.match(/clip\/([A-Za-z0-9_-]+)/) || url.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export function initModal() {
  const dataScript = document.getElementById('all-words-data');
  if (!dataScript) return;

  try {
    words = JSON.parse(dataScript.textContent);
    wordMap.clear();
    words.forEach((w, idx) => {
      wordMap.set(w.id, { word: w, index: idx });
    });
  } catch (err) {
    console.error('Failed to parse words data for modal:', err);
    return;
  }

  const modalEl = document.getElementById('word-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const prevBtn = document.getElementById('modal-prev-btn');
  const nextBtn = document.getElementById('modal-next-btn');

  if (!modalEl) return;

  // Update visible word IDs (filtered cards currently in DOM)
  function updateVisibleWordIds() {
    const visibleCards = document.querySelectorAll('.word-card:not([style*="display: none"])');
    if (visibleCards.length > 0) {
      visibleWordIds = Array.from(visibleCards).map((card) => Number(card.getAttribute('data-id')));
    } else {
      visibleWordIds = words.map((w) => w.id);
    }
  }

  function renderModal(word) {
    const content = document.getElementById('modal-content');
    const titleEntry = document.getElementById('modal-titlebar-entry');
    const titleWork = document.getElementById('modal-titlebar-work');
    const navCounter = document.getElementById('modal-nav-counter');
    const hostname = window.location.hostname || 'localhost';

    if (!content) return;

    if (titleEntry) titleEntry.textContent = `ENTRY #${word.id}`;
    if (titleWork) titleWork.textContent = word.workTitle || word.tag;

    updateVisibleWordIds();
    const visibleIdx = visibleWordIds.indexOf(word.id);
    if (navCounter) {
      navCounter.textContent = `${visibleIdx >= 0 ? visibleIdx + 1 : 1} / ${visibleWordIds.length}`;
    }

    const hasClip = Boolean(word.twitchClipUrl);
    const clipSlug = extractClipSlug(word.twitchClipUrl);
    const highlightedSentence = formatSentence(word.sentence, word.term, word.wordRange);

    const mediaHtml = hasClip
      ? `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="flex flex-col border border-border-default bg-surface">
            <div class="px-3 py-1.5 bg-surface-alt border-b border-border-default text-xs font-mono text-text-muted flex justify-between">
              <span>[ IN-GAME SCREENSHOT ]</span>
              <span>100% CAPTURE</span>
            </div>
            <div class="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              ${word.screenshotUrl ? `<img src="${word.screenshotUrl}" alt="${word.term}" class="w-full h-full object-contain" />` : '<span class="text-text-dim font-mono text-xs">[ NO SCREENSHOT ]</span>'}
            </div>
          </div>
          <div class="flex flex-col border border-border-default bg-surface">
            <div class="px-3 py-1.5 bg-surface-alt border-b border-border-default text-xs font-mono text-text-muted flex justify-between items-center">
              <span class="text-accent-rust font-semibold">[ TWITCH STREAM CLIP ]</span>
              <a href="${word.twitchClipUrl}" target="_blank" rel="noopener noreferrer" class="text-accent-amber hover:underline flex items-center gap-1 font-mono text-xs">
                [ Open Clip &nearr; ]
              </a>
            </div>
            <div class="relative aspect-video bg-black flex items-center justify-center">
              ${clipSlug ? `
                <iframe
                  src="https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${hostname}&autoplay=false"
                  class="w-full h-full border-0"
                  allowfullscreen
                  title="Twitch Clip"
                ></iframe>
              ` : `
                <a href="${word.twitchClipUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 border border-accent-rust text-accent-rust font-mono text-xs hover:bg-accent-rust hover:text-canvas">
                  [ Watch Clip on Twitch &nearr; ]
                </a>
              `}
            </div>
          </div>
        </div>
      `
      : `
        <div class="border border-border-default bg-surface">
          <div class="px-3 py-1.5 bg-surface-alt border-b border-border-default text-xs font-mono text-text-muted flex justify-between">
            <span>[ IN-GAME SCREENSHOT ]</span>
            <span>FULL HERO WIDTH</span>
          </div>
          <div class="relative w-full aspect-video max-h-[500px] bg-black flex items-center justify-center overflow-hidden">
            ${word.screenshotUrl ? `<img src="${word.screenshotUrl}" alt="${word.term}" class="w-full h-full object-contain" />` : '<span class="text-text-dim font-mono text-xs">[ NO SCREENSHOT ]</span>'}
          </div>
        </div>
      `;

    const definitionsHtml = word.definitions && word.definitions.length > 0
      ? word.definitions.map((def, idx) => `
          <li class="flex items-start gap-3">
            <span class="text-accent-amber font-semibold shrink-0">[${idx + 1}]</span>
            <span>${escapeHtml(def)}</span>
          </li>
        `).join('')
      : `<li class="text-text-muted">${escapeHtml(word.definitionText || 'No definitions available.')}</li>`;

    const pitchAccentHtml = word.pitchAccent
      ? `
        <div class="mt-2 text-xs font-mono text-accent-amber flex items-center gap-2">
          <span class="text-text-dim">PITCH ACCENT:</span>
          <span>${escapeHtml(word.pitchAccent.pattern || `Pattern [${word.pitchAccent.downstep}]`)}</span>
        </div>
      `
      : '';

    content.innerHTML = `
      <div class="flex flex-col gap-6">
        <!-- Word Header -->
        <div class="border-b border-border-default pb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-baseline gap-4 flex-wrap">
              <h2 class="text-3xl sm:text-5xl font-bold font-jp text-text-bright tracking-tight">
                ${word.term}
              </h2>
              <span class="text-lg sm:text-2xl text-text-muted font-mono">
                ${word.reading}
              </span>
            </div>
            ${pitchAccentHtml}
          </div>

          <div class="flex flex-col items-start sm:items-end gap-1.5 font-mono text-xs text-text-dim">
            <div class="flex items-center gap-2">
              <span class="text-text-bright font-bold">[ ENTRY #${word.id} ]</span>
              ${hasClip ? '<span class="border border-accent-rust/70 bg-canvas text-accent-rust px-2 py-0.5 font-bold">[ CLIP ]</span>' : ''}
            </div>
            <div class="flex items-center gap-2 text-text-muted">
              <span>Work:</span>
              <a href="/works/${word.workSlug}" class="text-accent-amber hover:underline">
                [ ${escapeHtml(word.workTitle || word.tag)} ]
              </a>
            </div>
            <div class="flex items-center gap-3">
              ${word.frequencyRank ? `<span>Freq: <strong class="text-text-main">#${word.frequencyRank}</strong></span>` : ''}
              <span>Date: <strong class="text-text-main">${word.dateFormatted}</strong></span>
            </div>
          </div>
        </div>

        <!-- Media Section -->
        <section>
          <div class="text-xs font-mono text-text-dim mb-2 flex items-center justify-between">
            <span>// SOURCE MEDIA</span>
            ${hasClip ? '<span>[ DUAL MEDIA MODE ]</span>' : ''}
          </div>
          ${mediaHtml}
        </section>

        <!-- Sentence Section -->
        <section>
          <div class="text-xs font-mono text-text-dim mb-2">
            // CONTEXT SENTENCE (${escapeHtml(word.workTitle || word.tag)})
          </div>
          <div class="border border-border-default bg-surface-alt p-4 sm:p-5">
            <blockquote class="text-lg sm:text-xl font-jp text-text-bright leading-relaxed">
              ${highlightedSentence}
            </blockquote>
          </div>
        </section>

        <!-- Definitions Section -->
        <section>
          <div class="text-xs font-mono text-text-dim mb-2">
            // DEFINITIONS & GLOSSES
          </div>
          <div class="border border-border-default bg-surface-alt p-4 sm:p-5">
            <ul class="space-y-3 font-mono text-sm sm:text-base text-text-main">
              ${definitionsHtml}
            </ul>
          </div>
        </section>

        <!-- Action bar -->
        <div class="border-t border-border-default pt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div class="flex items-center gap-2">
            <button 
              type="button" 
              id="modal-copy-link-btn"
              class="px-3 py-1.5 border border-border-default hover:border-accent-amber bg-surface text-text-main hover:bg-surface-alt transition-colors"
            >
              [ Copy Direct Link ]
            </button>
            <a 
              href="/words/${word.id}" 
              class="px-3 py-1.5 border border-border-default hover:border-accent-amber bg-surface text-text-muted hover:text-text-bright transition-colors"
            >
              [ Standalone Page &rarr; ]
            </a>
          </div>
          <div class="text-text-dim">
            <span>KIND: <span class="text-text-bright">${(word.kind || 'vocab').toUpperCase()}</span></span>
          </div>
        </div>
      </div>
    `;

    // Hook up copy button
    const copyBtn = document.getElementById('modal-copy-link-btn');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        const link = `${window.location.origin}/words/${word.id}`;
        try {
          await navigator.clipboard.writeText(link);
          const orig = copyBtn.textContent;
          copyBtn.textContent = '[ Copied! ]';
          setTimeout(() => { copyBtn.textContent = orig; }, 2000);
        } catch {
          prompt('Copy link:', link);
        }
      };
    }
  }

  function openModal(wordId, updateUrl = true) {
    const entry = wordMap.get(Number(wordId));
    if (!entry) return;

    currentWordIndex = entry.index;
    renderModal(entry.word);
    modalEl.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('word', String(wordId));
      window.history.pushState({ wordId }, '', url.toString());
    }
  }

  function closeModal(updateUrl = true) {
    modalEl.classList.add('hidden');
    document.body.style.overflow = '';
    const content = document.getElementById('modal-content');
    if (content) content.innerHTML = '';

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.delete('word');
      window.history.pushState({}, '', url.toString());
    }
  }

  function navigateModal(direction) {
    updateVisibleWordIds();
    if (visibleWordIds.length === 0) return;

    const currentWord = words[currentWordIndex];
    if (!currentWord) return;

    let currentPos = visibleWordIds.indexOf(currentWord.id);
    if (currentPos === -1) currentPos = 0;

    let nextPos = currentPos + direction;
    if (nextPos < 0) nextPos = visibleWordIds.length - 1;
    if (nextPos >= visibleWordIds.length) nextPos = 0;

    const nextId = visibleWordIds[nextPos];
    openModal(nextId, true);
  }

  // Card click delegation
  document.addEventListener('click', (e) => {
    const cardLink = e.target.closest('[data-card-link]');
    if (cardLink && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      const card = cardLink.closest('.word-card');
      if (card) {
        const id = card.getAttribute('data-id');
        openModal(Number(id));
      }
    }
  });

  // Modal close handlers
  if (closeBtn) closeBtn.onclick = () => closeModal();
  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  if (prevBtn) prevBtn.onclick = () => navigateModal(-1);
  if (nextBtn) nextBtn.onclick = () => navigateModal(1);

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (modalEl.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowLeft') {
      navigateModal(-1);
    } else if (e.key === 'ArrowRight') {
      navigateModal(1);
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', (e) => {
    const params = new URLSearchParams(window.location.search);
    const wordId = params.get('word');
    if (wordId) {
      openModal(Number(wordId), false);
    } else {
      closeModal(false);
    }
  });

  // Check URL on load for ?word=X
  const initialParams = new URLSearchParams(window.location.search);
  const initialWordId = initialParams.get('word');
  if (initialWordId && wordMap.has(Number(initialWordId))) {
    openModal(Number(initialWordId), false);
  }
}

// Auto-run when loaded as module or script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModal);
} else {
  initModal();
}
