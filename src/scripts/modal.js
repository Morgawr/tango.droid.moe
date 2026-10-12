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
    console.error('Failed to parse words data:', err);
    return;
  }

  const modalEl = document.getElementById('word-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const prevBtn = document.getElementById('modal-prev-btn');
  const nextBtn = document.getElementById('modal-next-btn');

  if (!modalEl) return;

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

    if (titleEntry) titleEntry.textContent = `Entry #${word.id}`;
    if (titleWork) titleWork.textContent = word.tag;

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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="aspect-video bg-black border border-border-default flex items-center justify-center overflow-hidden">
            ${word.screenshotUrl ? `<img src="${word.screenshotUrl}" alt="${word.term}" class="w-full h-full object-contain" />` : '<span class="text-text-dim font-mono text-xs">[ No Image ]</span>'}
          </div>
          <div class="aspect-video bg-black border border-border-default flex items-center justify-center">
            ${clipSlug ? `
              <iframe
                src="https://clips.twitch.tv/embed?clip=${clipSlug}&parent=${hostname}&autoplay=false"
                class="w-full h-full border-0"
                allowfullscreen
                title="Twitch Clip"
              ></iframe>
            ` : `
              <a href="${word.twitchClipUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 border border-accent-rust text-accent-rust font-mono text-xs hover:bg-accent-rust hover:text-canvas">
                [ Watch Clip &nearr; ]
              </a>
            `}
          </div>
        </div>
      `
      : `
        <div class="w-full aspect-video max-h-[480px] bg-black border border-border-default flex items-center justify-center overflow-hidden">
          ${word.screenshotUrl ? `<img src="${word.screenshotUrl}" alt="${word.term}" class="w-full h-full object-contain" />` : '<span class="text-text-dim font-mono text-xs">[ No Image ]</span>'}
        </div>
      `;

    const definitionsHtml = word.definitions && word.definitions.length > 0
      ? word.definitions.map((def, idx) => `
          <li class="flex items-start gap-2">
            <span class="text-accent-green-bright font-semibold shrink-0">[${idx + 1}]</span>
            <span>${escapeHtml(def)}</span>
          </li>
        `).join('')
      : `<li class="text-text-muted">${escapeHtml(word.definitionText || 'No definition available.')}</li>`;

    content.innerHTML = `
      <div class="flex flex-col gap-5">
        <!-- Header -->
        <div class="border-b border-border-default pb-3 flex flex-wrap items-baseline justify-between gap-3">
          <div class="flex items-baseline gap-3 flex-wrap">
            <h2 class="text-3xl sm:text-4xl font-bold font-jp text-text-bright">
              ${word.term}
            </h2>
            <span class="text-lg sm:text-xl text-text-muted font-mono">
              ${word.reading}
            </span>
          </div>

          <div class="flex items-center gap-2 font-mono text-xs">
            <a href="/works/${word.workSlug}" class="border border-border-green bg-surface-green text-accent-green-bright hover:border-accent-green-bright px-2 py-0.5 transition-colors">
              [ ${escapeHtml(word.tag)} ]
            </a>
            ${hasClip ? '<span class="border border-accent-rust text-accent-rust px-1.5 py-0.5">[ CLIP ]</span>' : ''}
            ${word.frequencyRank ? `<span class="text-text-dim">#${word.frequencyRank}</span>` : ''}
          </div>
        </div>

        <!-- Media -->
        ${mediaHtml}

        <!-- Sentence -->
        <div class="border border-border-green bg-surface-green/40 p-4">
          <p class="text-base sm:text-lg font-jp text-text-bright leading-relaxed">
            ${highlightedSentence}
          </p>
        </div>

        <!-- Definitions -->
        <div class="border border-border-default bg-surface-alt p-4">
          <ul class="space-y-2 font-mono text-xs sm:text-sm text-text-main">
            ${definitionsHtml}
          </ul>
        </div>

        <!-- Actions -->
        <div class="pt-2 flex items-center justify-between font-mono text-xs">
          <button 
            type="button" 
            id="modal-copy-link-btn"
            class="px-2.5 py-1 border border-border-default hover:border-accent-green bg-surface text-text-muted hover:text-accent-green-bright transition-colors"
          >
            [ Copy Link ]
          </button>
          <a 
            href="/words/${word.id}" 
            class="text-text-muted hover:text-accent-green-bright hover:underline"
          >
            [ Permapage &rarr; ]
          </a>
        </div>
      </div>
    `;

    const copyBtn = document.getElementById('modal-copy-link-btn');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        const link = `${window.location.origin}/words/${word.id}`;
        try {
          await navigator.clipboard.writeText(link);
          const orig = copyBtn.textContent;
          copyBtn.textContent = '[ Copied ]';
          setTimeout(() => { copyBtn.textContent = orig; }, 1500);
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

  if (closeBtn) closeBtn.onclick = () => closeModal();
  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  if (prevBtn) prevBtn.onclick = () => navigateModal(-1);
  if (nextBtn) nextBtn.onclick = () => navigateModal(1);

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

  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const wordId = params.get('word');
    if (wordId) {
      openModal(Number(wordId), false);
    } else {
      closeModal(false);
    }
  });

  const initialParams = new URLSearchParams(window.location.search);
  const initialWordId = initialParams.get('word');
  if (initialWordId && wordMap.has(Number(initialWordId))) {
    openModal(Number(initialWordId), false);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModal);
} else {
  initModal();
}
