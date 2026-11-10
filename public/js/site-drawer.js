const drawer = document.querySelector('#site-drawer');
const sidebar = drawer.closest('.site-sidebar');
const toggle = drawer.querySelector('summary');
const lastLink = drawer.querySelector('.site-nav a:last-child');
const page = document.querySelector('.site-body');
const skipLink = document.querySelector('.skip-link');
const backdrop = document.querySelector('.drawer-backdrop');
const mobile = window.matchMedia('(max-width: 760px)');
let desktopOpen = drawer.open;

function updateDrawer() {
  const modalOpen = mobile.matches && drawer.open;
  backdrop.hidden = !modalOpen;
  page.inert = modalOpen;
  skipLink.inert = modalOpen;
  document.body.classList.toggle('drawer-modal-open', modalOpen);

  if (modalOpen) {
    sidebar.setAttribute('role', 'dialog');
    sidebar.setAttribute('aria-label', 'Site navigation');
    sidebar.setAttribute('aria-modal', 'true');
    if (!drawer.contains(document.activeElement)) {
      toggle.focus();
    }
  } else {
    sidebar.removeAttribute('role');
    sidebar.removeAttribute('aria-label');
    sidebar.removeAttribute('aria-modal');
  }
}

function closeDrawer() {
  drawer.open = false;
  updateDrawer();
  toggle.focus();
}

drawer.addEventListener('toggle', () => {
  if (!mobile.matches) {
    desktopOpen = drawer.open;
  }
  updateDrawer();
});

mobile.addEventListener('change', () => {
  const focusWasInDrawer = drawer.contains(document.activeElement);
  drawer.open = !mobile.matches && desktopOpen;
  updateDrawer();
  if (focusWasInDrawer && !drawer.open) {
    toggle.focus();
  }
});

drawer.addEventListener('keydown', (event) => {
  if (!drawer.open) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeDrawer();
  }

  if (event.key === 'Tab' && mobile.matches) {
    const edge = event.shiftKey ? toggle : lastLink;
    if (document.activeElement === edge) {
      event.preventDefault();
      (event.shiftKey ? lastLink : toggle).focus();
    }
  }
});

backdrop.addEventListener('click', closeDrawer);
drawer.open = !mobile.matches && desktopOpen;
sidebar.classList.add('is-interactive');
updateDrawer();
