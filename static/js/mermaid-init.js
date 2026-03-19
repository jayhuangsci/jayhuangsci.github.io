import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';

mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: '"Avenir Next", "Segoe UI", "PingFang SC", sans-serif',
  themeVariables: {
    primaryColor: '#f8f3ea',
    primaryTextColor: '#242018',
    lineColor: '#8f7e66',
    tertiaryColor: '#fffdf8'
  }
});

function collectMermaidBlocks() {
  const seen = new Set();
  const blocks = [];

  document.querySelectorAll('pre.mermaid').forEach((pre) => {
    if (!seen.has(pre)) {
      seen.add(pre);
      blocks.push({ host: pre, source: pre.textContent || '' });
    }
  });

  document
    .querySelectorAll('code.language-mermaid, code[data-lang="mermaid"], pre code.language-mermaid')
    .forEach((code) => {
      const host = code.closest('.highlight') || code.closest('pre') || code.parentElement;
      if (!host || seen.has(host)) {
        return;
      }
      seen.add(host);
      blocks.push({ host, source: code.textContent || '' });
    });

  return blocks;
}

async function renderMermaidBlocks() {
  const blocks = collectMermaidBlocks();

  for (let i = 0; i < blocks.length; i += 1) {
    const { host, source } = blocks[i];
    const code = source.trim();
    if (!code) {
      continue;
    }

    try {
      const id = `mermaid-${i}-${Math.random().toString(36).slice(2, 10)}`;
      const { svg, bindFunctions } = await mermaid.render(id, code);

      const outer = document.createElement('div');
      outer.className = 'diagram-block';

      const inner = document.createElement('div');
      inner.className = 'mermaid-rendered';
      inner.innerHTML = svg;
      outer.appendChild(inner);

      host.replaceWith(outer);
      if (bindFunctions) {
        bindFunctions(inner);
      }
    } catch (error) {
      console.error('Failed to render Mermaid block:', error);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderMermaidBlocks, { once: true });
} else {
  renderMermaidBlocks();
}
