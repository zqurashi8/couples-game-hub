(function initModeToggleScript() {
    const normalizeMode = (mode) => (mode === 'online' ? 'online' : 'local');

    window.initModeToggle = function initModeToggle(currentMode) {
        const mode = normalizeMode(currentMode);
        const badge = document.getElementById('modeBadge');
        if (badge) {
            badge.textContent = mode === 'online' ? 'Online' : 'Local';
        }

        const buttons = document.querySelectorAll('.mode-btn');
        if (!buttons.length) {
            return;
        }

        buttons.forEach((button) => {
            const buttonMode = normalizeMode(button.dataset.mode);
            const isActive = buttonMode === mode;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
            button.addEventListener('click', () => {
                if (buttonMode === mode) {
                    return;
                }
                const url = new URL(window.location.href);
                url.searchParams.set('mode', buttonMode);
                window.location.href = url.toString();
            });
        });
    };
})();
