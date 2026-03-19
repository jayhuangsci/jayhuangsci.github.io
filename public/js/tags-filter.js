function parseTagsParam(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueTags(tags) {
  return Array.from(new Set(tags));
}

function normalizeTag(tag) {
  return (tag || '').trim().toLowerCase();
}

function getTagsFromSearch() {
  const params = new URLSearchParams(window.location.search);
  return uniqueTags(parseTagsParam(params.get('tags')));
}

function initTagFilter(root) {
  const filterNav = root.querySelector('[data-tag-filter]');
  const chips = Array.from(root.querySelectorAll('[data-tag]'));
  const posts = Array.from(root.querySelectorAll('[data-post-tags]'));
  const emptyState = root.querySelector('[data-tag-empty-state]');
  const summary = root.querySelector('[data-tag-summary]');
  const baseUrl = root.dataset.baseUrl || '/writing/';
  const initialTag = normalizeTag(root.dataset.initialTag || '');

  if (!filterNav || chips.length === 0 || posts.length === 0) {
    return;
  }

  let selectedTags = getTagsFromSearch();
  if (selectedTags.length === 0 && initialTag) {
    selectedTags = [initialTag];
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.pathname = baseUrl;
    if (selectedTags.length > 0) {
      url.searchParams.set('tags', selectedTags.join(','));
    } else {
      url.searchParams.delete('tags');
    }
    url.hash = '';
    window.history.replaceState(null, '', url.toString());
  }

  function render() {
    const selectedSet = new Set(selectedTags);
    let visibleCount = 0;

    posts.forEach((post) => {
      const tags = (post.dataset.postTags || '').split(' ').filter(Boolean);
      const matched =
        selectedSet.size === 0 || Array.from(selectedSet).every((tag) => tags.includes(tag));
      post.hidden = !matched;
      post.classList.toggle('is-hidden', !matched);
      if (matched) {
        visibleCount += 1;
      }
    });

    chips.forEach((chip) => {
      const tag = normalizeTag(chip.dataset.tag);
      const active = tag === '' ? selectedSet.size === 0 : selectedSet.has(tag);
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (summary) {
      if (selectedSet.size === 0) {
        summary.textContent = '当前显示全部文章。';
      } else {
        summary.textContent = `已选择 ${selectedSet.size} 个标签，按 AND 组合筛选。`;
      }
    }

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }
  }

  filterNav.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-tag]');
    if (!chip) {
      return;
    }

    event.preventDefault();
    const tag = normalizeTag(chip.dataset.tag);

    if (tag === '') {
      selectedTags = [];
    } else if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter((item) => item !== tag);
    } else {
      selectedTags = [...selectedTags, tag];
    }

    selectedTags = uniqueTags(selectedTags);
    render();
    updateUrl();
  });

  window.addEventListener('popstate', () => {
    selectedTags = getTagsFromSearch();
    if (selectedTags.length === 0 && initialTag && window.location.pathname.includes('/tags/')) {
      selectedTags = [initialTag];
    }
    render();
  });

  render();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tag-filter-root]').forEach((root) => {
    initTagFilter(root);
  });
});
