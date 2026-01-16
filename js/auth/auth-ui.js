/**
 * Authentication UI Manager - Couples Game Hub
 * Handles all authentication-related UI interactions, modals, and forms
 */

import authManager from './auth-manager.js';

/**
 * Open login modal
 */
export function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');

        // Focus on email input
        setTimeout(() => {
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) emailInput.focus();
        }, 100);
    }
}

/**
 * Open signup modal
 */
export function openSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');

        // Focus on name input
        setTimeout(() => {
            const nameInput = document.getElementById('signupName');
            if (nameInput) nameInput.focus();
        }, 100);
    }
}

/**
 * Open upgrade modal (for anonymous users)
 */
export function showUpgradeModal() {
    const modal = document.getElementById('upgradeModal');
    if (modal) {
        modal.classList.add('active');
        document.body.classList.add('modal-open');

        // Focus on email input
        setTimeout(() => {
            const emailInput = document.getElementById('upgradeEmail');
            if (emailInput) emailInput.focus();
        }, 100);
    }
}

/**
 * Close all authentication modals
 */
export function closeAuthModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.classList.remove('modal-open');
}

/**
 * Switch from login to signup modal
 */
export function switchToSignup() {
    closeAuthModals();
    setTimeout(() => openSignupModal(), 100);
}

/**
 * Switch from signup to login modal
 */
export function switchToLogin() {
    closeAuthModals();
    setTimeout(() => openLoginModal(), 100);
}

/**
 * Handle login form submission
 */
export async function handleLoginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitButton = event.target.querySelector('button[type="submit"]');

    // Validate inputs
    if (!email || !password) {
        showNotification('error', 'Please fill in all fields');
        return;
    }

    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.classList.add('btn-loading');
    submitButton.textContent = '';

    try {
        await authManager.signInWithEmail(email, password);

        // Success
        showNotification('success', 'Welcome back!');
        closeAuthModals();

        // Clear form
        document.getElementById('loginForm').reset();
    } catch (error) {
        console.error('Login error:', error);
        showNotification('error', error.message);
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.classList.remove('btn-loading');
        submitButton.textContent = originalText;
    }
}

/**
 * Handle signup form submission
 */
export async function handleSignupSubmit(event) {
    event.preventDefault();

    const displayName = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const submitButton = event.target.querySelector('button[type="submit"]');

    // Validate inputs
    if (!displayName || !email || !password) {
        showNotification('error', 'Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showNotification('error', 'Password must be at least 6 characters');
        return;
    }

    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.classList.add('btn-loading');
    submitButton.textContent = '';

    try {
        await authManager.signUpWithEmail(email, password, displayName);

        // Success
        showNotification('success', `Welcome, ${displayName}! Your account has been created.`);
        closeAuthModals();

        // Clear form
        document.getElementById('signupForm').reset();
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('error', error.message);
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.classList.remove('btn-loading');
        submitButton.textContent = originalText;
    }
}

/**
 * Handle upgrade form submission (anonymous → email account)
 */
export async function handleUpgradeSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('upgradeEmail').value.trim();
    const password = document.getElementById('upgradePassword').value;
    const submitButton = event.target.querySelector('button[type="submit"]');

    // Validate inputs
    if (!email || !password) {
        showNotification('error', 'Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showNotification('error', 'Password must be at least 6 characters');
        return;
    }

    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.classList.add('btn-loading');
    submitButton.textContent = '';

    try {
        await authManager.upgradeAnonymousAccount(email, password);

        // Success
        showNotification('success', 'Your account is now permanent! All your progress has been saved.');
        closeAuthModals();

        // Clear form
        document.getElementById('upgradeForm').reset();
    } catch (error) {
        console.error('Upgrade error:', error);
        showNotification('error', error.message);
    } finally {
        // Reset button
        submitButton.disabled = false;
        submitButton.classList.remove('btn-loading');
        submitButton.textContent = originalText;
    }
}

/**
 * Handle sign out
 */
export async function handleSignOut() {
    try {
        await authManager.signOut();
        showNotification('success', 'Signed out successfully');

        // Redirect to home or reload
        window.location.reload();
    } catch (error) {
        console.error('Sign out error:', error);
        showNotification('error', 'Failed to sign out. Please try again.');
    }
}

/**
 * Toggle password visibility
 */
export function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle');

    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = 'Hide';
    } else {
        input.type = 'password';
        button.textContent = 'Show';
    }
}

/**
 * Update password strength indicator
 */
export function updatePasswordStrength(password) {
    const indicator = document.getElementById('passwordStrength');
    if (!indicator) return;

    if (!password) {
        indicator.className = 'password-strength';
        return;
    }

    // Calculate password strength
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength < 2) {
        indicator.className = 'password-strength weak';
    } else if (strength < 4) {
        indicator.className = 'password-strength medium';
    } else {
        indicator.className = 'password-strength strong';
    }
}

/**
 * Show notification toast
 */
export function showNotification(type, message, duration = 5000) {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        console.warn('Notification container not found');
        return;
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Icon based on type
    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    // Title based on type
    const titleMap = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    };

    notification.innerHTML = `
        <div class="notification-icon">${iconMap[type] || 'ℹ'}</div>
        <div class="notification-content">
            <div class="notification-title">${titleMap[type]}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.classList.add('hide'); setTimeout(() => this.parentElement.remove(), 300);">×</button>
    `;

    container.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Auto remove after duration
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

/**
 * Initialize authentication UI
 * Sets up event listeners and modal interactions
 */
export function initAuthUI() {
    // Modal backdrop click to close
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAuthModals();
            }
        });
    });

    // Modal close buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeAuthModals);
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAuthModals();
        }
    });

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Signup form submission
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }

    // Upgrade form submission
    const upgradeForm = document.getElementById('upgradeForm');
    if (upgradeForm) {
        upgradeForm.addEventListener('submit', handleUpgradeSubmit);
    }

    // Password strength indicator for signup
    const signupPassword = document.getElementById('signupPassword');
    if (signupPassword) {
        signupPassword.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }

    // Password strength indicator for upgrade
    const upgradePassword = document.getElementById('upgradePassword');
    if (upgradePassword) {
        upgradePassword.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }

    console.log('Authentication UI initialized');
}

// Make functions globally available for onclick handlers
if (typeof window !== 'undefined') {
    window.openLoginModal = openLoginModal;
    window.openSignupModal = openSignupModal;
    window.showUpgradeModal = showUpgradeModal;
    window.closeAuthModals = closeAuthModals;
    window.switchToSignup = switchToSignup;
    window.switchToLogin = switchToLogin;
    window.handleSignOut = handleSignOut;
    window.togglePasswordVisibility = togglePasswordVisibility;
    window.showNotification = showNotification;
}
