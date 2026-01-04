import { GOOGLE_SCOPES, STORAGE_KEYS } from '../utils/constants.js';

export class GoogleAuth {
    constructor() {
        this.tokenClient = null;
        this.user = null;
        this.accessToken = null;
        this.initialized = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.accounts) {
                this.initializeGoogleSDK();
                resolve();
            } else {
                // Load Google SDK
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    this.initializeGoogleSDK();
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            }
        });
    }

    initializeGoogleSDK() {
        // Load client configuration from Google Cloud Console
        // Replace with your actual client ID
        const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
        
        window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Initialize token client for Drive API
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: GOOGLE_SCOPES,
            callback: this.handleTokenResponse.bind(this),
            error_callback: this.handleTokenError.bind(this)
        });

        this.initialized = true;
        this.loadSavedUser();
    }

    handleCredentialResponse(response) {
        console.log('Google login response:', response);
        
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        this.user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            verified: payload.email_verified
        };

        this.saveUser();
        this.showUserInfo();
        
        // Request Drive access token
        this.requestDriveAccess();
        
        // Dispatch login event
        window.dispatchEvent(new CustomEvent('google:login', { detail: this.user }));
    }

    handleTokenResponse(response) {
        if (response.error) {
            console.error('Token error:', response.error);
            this.showError('Failed to get Drive access');
            return;
        }

        this.accessToken = response.access_token;
        console.log('Drive access token received');
        
        // Save token
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
            ...this.user,
            accessToken: this.accessToken,
            tokenExpiry: Date.now() + (response.expires_in * 1000)
        }));
        
        // Dispatch drive ready event
        window.dispatchEvent(new CustomEvent('google:drive-ready', { 
            detail: { user: this.user, token: this.accessToken }
        }));
    }

    handleTokenError(error) {
        console.error('Token error:', error);
        this.showError('Failed to connect to Google Drive');
    }

    requestDriveAccess() {
        if (!this.tokenClient) {
            console.error('Token client not initialized');
            return;
        }

        // Check if we already have a valid token
        const savedUser = this.getSavedUser();
        if (savedUser && savedUser.accessToken && savedUser.tokenExpiry > Date.now()) {
            this.accessToken = savedUser.accessToken;
            window.dispatchEvent(new CustomEvent('google:drive-ready', {
                detail: { user: this.user, token: this.accessToken }
            }));
            return;
        }

        // Request new token
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }

    showUserInfo() {
        const userSection = document.getElementById('user-section');
        if (!userSection) return;

        userSection.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    ${this.user.picture 
                        ? `<img src="${this.user.picture}" alt="${this.user.name}" style="width: 100%; height: 100%; border-radius: 50%;">`
                        : `<i class="fas fa-user"></i>`
                    }
                </div>
                <div class="user-details">
                    <span class="user-name">${this.user.name}</span>
                    <span class="user-status"><i class="fas fa-check-circle"></i> Connected</span>
                </div>
                <button class="logout-btn" id="google-logout-btn" title="Logout">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;

        // Add logout handler
        const logoutBtn = document.getElementById('google-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.logout();
            });
        }

        // Hide login modal if it exists
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'none';
        }
    }

    showLoginButton() {
        const userSection = document.getElementById('user-section');
        if (!userSection) return;

        userSection.innerHTML = `
            <button class="google-signin-btn" id="google-signin-btn">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                <span>Sign in with Google</span>
            </button>
        `;

        // Add login handler
        const loginBtn = document.getElementById('google-signin-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.signIn());
        }
    }

    signIn() {
        if (!this.initialized) {
            console.error('Google SDK not initialized');
            return;
        }

        window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback to regular login
                window.google.accounts.id.renderButton(
                    document.getElementById('google-signin-btn'),
                    { theme: 'outline', size: 'large' }
                );
            }
        });
    }

    logout() {
        // Clear saved user data
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        // Revoke Google token
        if (this.accessToken) {
            window.google.accounts.oauth2.revoke(this.accessToken, () => {
                console.log('Token revoked');
            });
        }

        // Reset state
        this.user = null;
        this.accessToken = null;
        
        // Update UI
        this.showLoginButton();
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('google:logout'));
        
        // Show login modal
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.style.display = 'flex';
        }
    }

    saveUser() {
        if (!this.user) return;
        
        const userData = {
            ...this.user,
            lastLogin: Date.now()
        };
        
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    }

    loadSavedUser() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.USER);
            if (saved) {
                const userData = JSON.parse(saved);
                
                // Check if token is still valid (expires in 1 hour)
                if (userData.tokenExpiry && userData.tokenExpiry > Date.now()) {
                    this.user = userData;
                    this.accessToken = userData.accessToken;
                    this.showUserInfo();
                    
                    // Notify that drive is ready
                    window.dispatchEvent(new CustomEvent('google:drive-ready', {
                        detail: { user: this.user, token: this.accessToken }
                    }));
                } else {
                    // Token expired, show login button
                    this.showLoginButton();
                }
            } else {
                this.showLoginButton();
            }
        } catch (error) {
            console.error('Failed to load saved user:', error);
            this.showLoginButton();
        }
    }

    getSavedUser() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.USER);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    }

    isAuthenticated() {
        return !!this.user && !!this.accessToken;
    }

    getAccessToken() {
        return this.accessToken;
    }

    getUser() {
        return this.user;
    }

    showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Export singleton instance
export const googleAuth = new GoogleAuth();
