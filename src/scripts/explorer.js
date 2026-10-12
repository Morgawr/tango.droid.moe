// Client-side Explorer Filtering, Search, and Sorting

export function initExplorer() {
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const workFilterBtns = document.querySelectorAll('[data-filter-work]');
  const clipToggleBtn = document.getElementById('filter-clip-btn');
  const sortSelect = document.getElementById('sort-select');
  const counterEl = document.getElementById('filter-counter');
  const emptyStateEl = document.getElementById('empty-results-state');
  const wordsGrid = document.getElementById('words-grid');
  const resetAllBtn = document.getElementById('reset-filters-btn');

  if (!wordsGrid) return;

  const cardElements = Array.from(document.querySelectorAll('.word-card'));
  const totalCards = cardElements.length;

  let currentQuery = '';
  let currentWork = 'all';
  let clipsOnly = false;
  let currentSort = 'newest';

  // Parse initial query params from URL
  const initialParams = new URLSearchParams(window.location.search);
  if (initialParams.has('work')) {
    currentWork = initialParams.get('work') || 'all';
  }
  if (initialParams.has('q')) {
    currentQuery = initialParams.get('q') || '';
    if (searchInput) searchInput.value = currentQuery;
  }
  if (initialParams.get('clips') === 'true') {
    clipsOnly = true;
  }
  if (initialParams.has('sort')) {
    currentSort = initialParams.get('sort') || 'newest';
    if (sortSelect) sortSelect.value = currentSort;
  }

  function updateWorkButtonStates() {
    workFilterBtns.forEach((btn) => {
      const workSlug = btn.getAttribute('data-filter-work');
      if (workSlug === currentWork) {
        btn.classList.add('border-accent-amber', 'bg-surface-alt', 'text-accent-amber', 'font-semibold');
        btn.classList.remove('border-border-default', 'bg-surface', 'text-text-muted');
      } else {
        btn.classList.remove('border-accent-amber', 'bg-surface-alt', 'text-accent-amber', 'font-semibold');
        btn.classList.add('border-border-default', 'bg-surface', 'text-text-muted');
      }
    });
  }

  function updateClipButtonState() {
    if (!clipToggleBtn) return;
    if (clipsOnly) {
      clipToggleBtn.classList.add('border-accent-rust', 'bg-surface-alt', 'text-accent-rust', 'font-semibold');
      clipToggleBtn.classList.remove('border-border-default', 'bg-surface', 'text-text-muted');
      clipToggleBtn.textContent = '[ \u2713 Clips Only ]';
    } else {
      clipToggleBtn.classList.remove('border-accent-rust', 'bg-surface-alt', 'text-accent-rust', 'font-semibold');
      clipToggleBtn.classList.add('border-border-default', 'bg-surface', 'text-text-muted');
      clipToggleBtn.textContent = '[ Clips Only ]';
    }
  }

  function applyFilters() {
    const q = currentQuery.trim().toLowerCase();
    let visibleCount = 0;

    cardElements.forEach((card) => {
      const term = (card.getAttribute('data-term') || '').toLowerCase();
      const reading = (card.getAttribute('data-reading') || '').toLowerCase();
      const textContent = (card.textContent || '').toLowerCase();
      const workSlug = card.getAttribute('data-work-slug') || '';
      const hasClip = card.getAttribute('data-has-clip') === 'true';

      // 1. Text Search matching
      let matchesSearch = true;
      if (q) {
        matchesSearch = term.includes(q) || reading.includes(q) || textContent.includes(q);
      }

      // 2. Work filter matching
      let matchesWork = true;
      if (currentWork !== 'all') {
        matchesWork = workSlug === currentWork;
      }

      // 3. Clips only matching
      let matchesClip = true;
      if (clipsOnly) {
        matchesClip = hasClip;
      }

      const isVisible = matchesSearch && matchesWork && matchesClip;
      if (isVisible) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update Counter
    if (counterEl) {
      counterEl.textContent = `${visibleCount} / ${totalCards}`;
    }

    // Toggle Empty State
    if (emptyStateEl) {
      if (visibleCount === 0) {
        emptyStateEl.classList.remove('hidden');
      } else {
        emptyStateEl.classList.add('hidden');
      }
    }

    // Toggle Clear button
    if (clearSearchBtn) {
      if (q) {
        clearSearchBtn.classList.remove('hidden');
      } else {
        clearSearchBtn.classList.add('hidden');
      }
    }

    applySort();
  }

  function applySort() {
    const sortedCards = [...cardElements];

    sortedCards.sort((a, b) => {
      const createdA = Number(a.getAttribute('data-created') || 0);
      const createdB = Number(b.getAttribute('data-created') || 0);
      const freqA = Number(a.getAttribute('data-frequency') || 999999);
      const freqB = Number(b.getAttribute('data-frequency') || 999999);
      const termA = a.getAttribute('data-term') || '';
      const termB = b.getAttribute('data-term') || '';

      switch (currentSort) {
        case 'oldest':
          return createdA - createdB;
        case 'freq-asc':
          return freqA - freqB; // most frequent first
        case 'freq-desc':
          return freqB - freqA; // rarest first
        case 'term':
          return termA.localeCompare(termB, 'ja');
        case 'newest':
        default:
          return createdB - createdA;
      }
    });

    sortedCards.forEach((card) => {
      wordsGrid.appendChild(card);
    });
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentQuery = e.target.value;
      applyFilters();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      currentQuery = '';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      applyFilters();
    });
  }

  workFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const slug = btn.getAttribute('data-filter-work') || 'all';
      currentWork = slug;
      updateWorkButtonStates();
      applyFilters();
    });
  });

  if (clipToggleBtn) {
    clipToggleBtn.addEventListener('click', () => {
      clipsOnly = !clipsOnly;
      updateClipButtonState();
      applyFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applySort();
    });
  }

  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      currentQuery = '';
      currentWork = 'all';
      clipsOnly = false;
      currentSort = 'newest';
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'newest';
      updateWorkButtonStates();
      updateClipButtonState();
      applyFilters();
    });
  }

  // Initialize view
  updateWorkButtonStates();
  updateClipButtonState();
  applyFilters();
}

// Auto-run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExplorer);
} else {
  initExplorer();
}
