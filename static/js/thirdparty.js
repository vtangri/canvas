/**
 * Third-Party API Integration
 * Includes: Google Maps API and Spotify API (or alternative public APIs)
 */

// API Keys - In production, these should be stored securely
// For demo purposes, using public APIs that don't require keys or have free tiers
const API_CONFIG = {
    // Google Maps API Key - Replace with your own key
    GOOGLE_MAPS_KEY: 'YOUR_GOOGLE_MAPS_API_KEY',
    // Spotify API - Using public endpoints or alternative
    SPOTIFY_CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID',
    SPOTIFY_CLIENT_SECRET: 'YOUR_SPOTIFY_CLIENT_SECRET',
    // Twitter API - Using public endpoints (Note: Twitter API v2 requires authentication)
    TWITTER_BEARER_TOKEN: 'YOUR_TWITTER_BEARER_TOKEN'
};

/**
 * Google Maps API Integration
 */
const MapsAPI = {
    map: null,
    marker: null,
    isLoaded: false,

    /**
     * Load Google Maps script
     * @returns {Promise<void>}
     */
    async loadScript() {
        if (this.isLoaded) return;

        // Check if API key is configured
        if (!API_CONFIG.GOOGLE_MAPS_KEY || API_CONFIG.GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
            throw new Error('Google Maps API key not configured');
        }

        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector('script[src*="maps.googleapis.com"]')) {
                this.isLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${API_CONFIG.GOOGLE_MAPS_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                this.isLoaded = true;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Google Maps API'));
            };
            document.head.appendChild(script);
        });
    },

    /**
     * Initialize map
     * @param {HTMLElement} container - Container element for map
     * @param {Object} position - {lat, lng} position
     */
    async initMap(container, position) {
        // If no API key or key is placeholder, use fallback
        if (!API_CONFIG.GOOGLE_MAPS_KEY || API_CONFIG.GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
            this.showFallbackMap(container, position);
            return;
        }

        if (!this.isLoaded) {
            try {
                await this.loadScript();
            } catch (error) {
                console.error('Failed to load Google Maps:', error);
                this.showFallbackMap(container, position);
                return;
            }
        }

        if (!container || typeof google === 'undefined') {
            this.showFallbackMap(container, position);
            return;
        }

        this.map = new google.maps.Map(container, {
            zoom: 15,
            center: position,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });

        this.marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: 'Your Location',
            animation: google.maps.Animation.DROP
        });

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
            content: '<div style="padding: 10px;"><strong>Your Location</strong><br>Lat: ' + 
                     position.lat.toFixed(6) + '<br>Lng: ' + position.lng.toFixed(6) + '</div>'
        });

        this.marker.addListener('click', () => {
            infoWindow.open(this.map, this.marker);
        });
    },

    /**
     * Show fallback map using OpenStreetMap (no API key required)
     * @param {HTMLElement} container - Container element
     * @param {Object} position - {lat, lng} position
     */
    showFallbackMap(container, position) {
        if (!container) return;

        const zoom = 15;
        const tileUrl = `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;
        
        // Using Leaflet.js for fallback (lightweight, no API key)
        if (typeof L === 'undefined') {
            // Load Leaflet CSS and JS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                this.createLeafletMap(container, position, zoom);
            };
            document.body.appendChild(script);
        } else {
            this.createLeafletMap(container, position, zoom);
        }
    },

    /**
     * Create Leaflet map (fallback)
     * @param {HTMLElement} container - Container element
     * @param {Object} position - {lat, lng} position
     * @param {number} zoom - Zoom level
     */
    createLeafletMap(container, position, zoom) {
        if (typeof L === 'undefined') return;

        const map = L.map(container).setView([position.lat, position.lng], zoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        L.marker([position.lat, position.lng])
            .addTo(map)
            .bindPopup('<b>Your Location</b><br>Lat: ' + position.lat.toFixed(6) + 
                     '<br>Lng: ' + position.lng.toFixed(6))
            .openPopup();
    },

    /**
     * Display user location on map
     * @param {HTMLElement} container - Container element
     */
    async displayLocation(container) {
        const feedback = document.getElementById('location-feedback');
        
        try {
            // Get user's location
            const position = await window.GeolocationAPI.getPosition();
            
            const mapPosition = {
                lat: position.latitude,
                lng: position.longitude
            };

            // Initialize map
            await this.initMap(container, mapPosition);
            
            if (feedback) {
                feedback.textContent = `Location found: ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
                feedback.className = 'feedback success';
            }
        } catch (error) {
            console.error('Error displaying location:', error);
            if (feedback) {
                feedback.textContent = error.message || 'Unable to display location.';
                feedback.className = 'feedback error';
            }
        }
    }
};

/**
 * Spotify API Integration (or alternative music API)
 */
const MusicAPI = {
    /**
     * Get Spotify access token (requires client credentials)
     * @returns {Promise<string>} Access token
     */
    async getAccessToken() {
        // Note: This is a simplified version. In production, handle this server-side.
        if (!API_CONFIG.SPOTIFY_CLIENT_ID || !API_CONFIG.SPOTIFY_CLIENT_SECRET) {
            throw new Error('Spotify API credentials not configured');
        }

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(
                    API_CONFIG.SPOTIFY_CLIENT_ID + ':' + API_CONFIG.SPOTIFY_CLIENT_SECRET
                )
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error('Failed to get Spotify access token');
        }

        const data = await response.json();
        return data.access_token;
    },

    /**
     * Get featured playlists from Spotify
     * @param {string} accessToken - Spotify access token
     * @returns {Promise<Object>} Playlist data
     */
    async getFeaturedPlaylists(accessToken) {
        const response = await fetch('https://api.spotify.com/v1/browse/featured-playlists?limit=5', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Spotify playlists');
        }

        return await response.json();
    },

    /**
     * Display Spotify playlist (or fallback to public API)
     * @param {HTMLElement} container - Container element
     */
    async displayPlaylist(container) {
        if (!container) return;

        const loadingEl = document.getElementById('music-loading');
        
        try {
            // Try Spotify API first (only if credentials are configured)
            const hasSpotifyCredentials = API_CONFIG.SPOTIFY_CLIENT_ID && 
                                        API_CONFIG.SPOTIFY_CLIENT_SECRET &&
                                        API_CONFIG.SPOTIFY_CLIENT_ID !== 'YOUR_SPOTIFY_CLIENT_ID' &&
                                        API_CONFIG.SPOTIFY_CLIENT_SECRET !== 'YOUR_SPOTIFY_CLIENT_SECRET';
            
            if (hasSpotifyCredentials) {
                try {
                    const token = await this.getAccessToken();
                    const data = await this.getFeaturedPlaylists(token);
                    this.renderSpotifyPlaylist(container, data);
                    if (loadingEl) loadingEl.style.display = 'none';
                    return;
                } catch (error) {
                    // Silently fall back if Spotify API fails
                    console.debug('Spotify API unavailable, using fallback');
                }
            }

            // Fallback: Use a public music API (e.g., Last.fm or MusicBrainz)
            await this.displayFallbackPlaylist(container);
            if (loadingEl) loadingEl.style.display = 'none';
        } catch (error) {
            console.error('Error displaying playlist:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            container.innerHTML = `
                <div class="error-message">
                    <p>Unable to load playlist. Please try again later.</p>
                    <p class="error-detail">${error.message}</p>
                </div>
            `;
        }
    },

    /**
     * Render Spotify playlist with player controls
     * @param {HTMLElement} container - Container element
     * @param {Object} data - Spotify API response
     */
    renderSpotifyPlaylist(container, data) {
        const playlists = data.playlists?.items || [];
        
        if (playlists.length === 0) {
            container.innerHTML = '<p>No playlists available.</p>';
            return;
        }

        let html = '<div class="spotify-playlists-grid">';
        playlists.forEach((playlist, index) => {
            const playlistId = `playlist_${index}`;
            html += `
                <div class="spotify-playlist-card" data-playlist-id="${playlistId}">
                    <div class="spotify-playlist-image">
                        ${playlist.images?.[0] ? 
                            `<img src="${playlist.images[0].url}" alt="${playlist.name}">` :
                            '<div class="spotify-playlist-placeholder">🎵</div>'
                        }
                        <button class="spotify-play-btn" data-playlist-id="${playlistId}" aria-label="Play">
                            <svg class="play-icon-svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="spotify-playlist-info">
                        <h3 class="spotify-playlist-name">${playlist.name}</h3>
                        <p class="spotify-playlist-description">${playlist.description || 'No description'}</p>
                        <div class="spotify-player" id="${playlistId}-player" style="display: none;">
                            <div class="spotify-player-main-controls">
                                <button class="spotify-control-btn shuffle-btn" aria-label="Shuffle" title="Shuffle">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                                    </svg>
                                </button>
                                <button class="spotify-control-btn prev-btn" aria-label="Previous" title="Previous">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                    </svg>
                                </button>
                                <button class="spotify-control-btn play-pause-btn" aria-label="Play/Pause" title="Play/Pause">
                                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style="display: none;">
                                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                    </svg>
                                </button>
                                <button class="spotify-control-btn next-btn" aria-label="Next" title="Next">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                    </svg>
                                </button>
                                <button class="spotify-control-btn repeat-btn" aria-label="Repeat" title="Repeat">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="spotify-progress-section">
                                <div class="spotify-progress-bar">
                                    <div class="spotify-progress-fill" style="width: 0%">
                                        <div class="spotify-progress-handle"></div>
                                    </div>
                                </div>
                                <div class="spotify-time">
                                    <span class="current-time">0:00</span>
                                    <span class="total-time">0:00</span>
                                </div>
                            </div>
                            <div class="spotify-volume-section">
                                <button class="spotify-volume-btn" aria-label="Volume" title="Volume">
                                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                    </svg>
                                </button>
                                <div class="spotify-volume-bar">
                                    <div class="spotify-volume-fill" style="width: 70%">
                                        <div class="spotify-volume-handle"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a href="${playlist.external_urls?.spotify || '#'}" target="_blank" rel="noopener" class="spotify-open-link">
                            Open in Spotify ↗
                        </a>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
        
        // Bind player controls
        this.bindPlayerControls();
    },

    /**
     * Display fallback playlist using public API
     * @param {HTMLElement} container - Container element
     */
    async displayFallbackPlaylist(container) {
        // Using free music sources for demo
        // Free music tracks from various sources
        const mockPlaylists = [
            {
                name: 'Focus & Productivity',
                description: 'Music to help you concentrate while learning',
                image: '🎯',
                tracks: [
                    { name: 'Ambient Study', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                    { name: 'Classical Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
                    { name: 'Lo-Fi Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
                ]
            },
            {
                name: 'Coding Playlist',
                description: 'Upbeat tracks for coding sessions',
                image: '💻',
                tracks: [
                    { name: 'Electronic Vibes', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
                    { name: 'Synthwave', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
                    { name: 'Indie Rock', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
                ]
            },
            {
                name: 'Relaxation Mix',
                description: 'Chill music for breaks and reflection',
                image: '🌙',
                tracks: [
                    { name: 'Acoustic', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
                    { name: 'Jazz', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
                    { name: 'Nature Sounds', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' }
                ]
            }
        ];

        let html = '<div class="spotify-playlists-grid">';
        mockPlaylists.forEach((playlist, index) => {
            const playlistId = `playlist_${index}`;
            // Create audio element with all tracks
            const audioSources = playlist.tracks.map(track => 
                `<source src="${track.url}" type="audio/mpeg">`
            ).join('');
            
            html += `
                <div class="spotify-playlist-card" data-playlist-id="${playlistId}">
                    <div class="spotify-playlist-image">
                        <div class="spotify-playlist-placeholder">${playlist.image}</div>
                        <button class="spotify-play-btn" data-playlist-id="${playlistId}" aria-label="Play">
                            <svg class="play-icon-svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="spotify-playlist-info">
                        <h3 class="spotify-playlist-name">${playlist.name}</h3>
                        <p class="spotify-playlist-description">${playlist.description}</p>
                        <div class="spotify-player" id="${playlistId}-player">
                            <div class="spotify-current-track" id="${playlistId}-current-track" style="display: none;">
                                <div class="spotify-current-track-icon">${playlist.image}</div>
                                <div class="spotify-current-track-info">
                                    <div class="spotify-current-track-name" id="${playlistId}-track-name">No track playing</div>
                                    <div class="spotify-current-track-playlist">${playlist.name}</div>
                                </div>
                            </div>
                            <div class="spotify-player-main-controls">
                                <button class="spotify-control-btn shuffle-btn" aria-label="Shuffle" title="Shuffle">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                                    </svg>
                                </button>
                                <button class="spotify-control-btn prev-btn" aria-label="Previous" title="Previous">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                                    </svg>
                                </button>
                                <button class="spotify-control-btn play-pause-btn" aria-label="Play/Pause" title="Play/Pause">
                                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                    </svg>
                                </button>
                                <button class="spotify-control-btn next-btn" aria-label="Next" title="Next">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                                    </svg>
                                </button>
                                <button class="spotify-control-btn repeat-btn" aria-label="Repeat" title="Repeat">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="spotify-progress-section">
                                <div class="spotify-progress-bar">
                                    <div class="spotify-progress-fill" style="width: 0%">
                                        <div class="spotify-progress-handle"></div>
                                    </div>
                                </div>
                                <div class="spotify-time">
                                    <span class="current-time">0:00</span>
                                    <span class="total-time">0:00</span>
                                </div>
                            </div>
                            <div class="spotify-volume-section">
                                <button class="spotify-volume-btn" aria-label="Volume" title="Volume">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                    </svg>
                                </button>
                                <div class="spotify-volume-bar">
                                    <div class="spotify-volume-fill" style="width: 70%">
                                        <div class="spotify-volume-handle"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="playlist-tracks">
                            <strong>Recommended Tracks:</strong>
                            <ul>
                                ${playlist.tracks.map(track => `<li data-track-url="${track.url}">${track.name || track}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <audio id="${playlistId}-audio" preload="metadata" style="display: none;" data-playlist-id="${playlistId}">
                        ${audioSources}
                    </audio>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
        
        // Bind player controls
        this.bindPlayerControls();
    },

    /**
     * Bind player controls for Spotify playlists
     */
    bindPlayerControls() {
        // Unbind existing listeners first if necessary.
        document.querySelectorAll('.spotify-play-btn').forEach(btn => {
            btn.onclick = null;
        });
        document.querySelectorAll('.play-pause-btn').forEach(btn => {
            btn.onclick = null;
        });
        document.querySelectorAll('.prev-btn, .next-btn').forEach(btn => {
            btn.onclick = null;
        });
        document.querySelectorAll('.spotify-progress-bar').forEach(bar => {
            bar.onclick = null;
        });
        document.querySelectorAll('.spotify-volume-bar').forEach(bar => {
            bar.onclick = null;
        });

        let playerState = {
            currentPlaying: null,
            currentAudio: null,
            progressInterval: null,
            currentTrackIndex: 0,
            currentPlaylistTracks: []
        };
        
        // Helper to pause all audios except the one for the given playlistId
        function pauseAllAudios(exceptPlaylistId) {
            document.querySelectorAll('audio[data-playlist-id]').forEach(audio => {
                const pid = audio.getAttribute('data-playlist-id');
                if (pid !== exceptPlaylistId) {
                    try { audio.pause(); } catch(e){}
                    audio.currentTime = 0;
                    // Also reset that UI
                    const card = document.querySelector(`[data-playlist-id="${pid}"]`);
                    const player = document.getElementById(`${pid}-player`);
                    if (player) player.style.display = 'block';
                    const playBtn = document.querySelector(`.spotify-play-btn[data-playlist-id="${pid}"]`);
                    if (playBtn) playBtn.style.display = 'flex';
                    const playPauseBtn = player?.querySelector('.play-pause-btn');
                    if (playPauseBtn) {
                        const playIcon = playPauseBtn.querySelector('.play-icon');
                        const pauseIcon = playPauseBtn.querySelector('.pause-icon');
                        if (playIcon) playIcon.style.display = 'block';
                        if (pauseIcon) pauseIcon.style.display = 'none';
                    }
                }
            });
        }
        
        // --- Bind play (floating) buttons ---
        document.querySelectorAll('.spotify-play-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const playlistId = btn.dataset.playlistId;
                const card = document.querySelector(`[data-playlist-id="${playlistId}"]`);
                const player = document.getElementById(`${playlistId}-player`);
                const playPauseBtn = player?.querySelector('.play-pause-btn');
                const audio = document.getElementById(`${playlistId}-audio`);
                
                // If already playing, pause it
                if (playerState.currentPlaying === playlistId && playerState.currentAudio && !playerState.currentAudio.paused) {
                    try { playerState.currentAudio.pause(); } catch(err){console.error(err);}
                    btn.style.display = 'flex';
                    if (playPauseBtn) {
                        const playIcon = playPauseBtn.querySelector('.play-icon');
                        const pauseIcon = playPauseBtn.querySelector('.pause-icon');
                        if (playIcon) playIcon.style.display = 'block';
                        if (pauseIcon) pauseIcon.style.display = 'none';
                    }
                    return;
                }
                // Pause all other audios and UI
                pauseAllAudios(playlistId);
                // Play this one
                if (audio) {
                    audio.volume = 0.7;
                    player.style.display = 'block';
                    btn.style.display = 'none';
                    try {
                        audio.play().then(()=>{
                            if (playPauseBtn) {
                                const playIcon = playPauseBtn.querySelector('.play-icon');
                                const pauseIcon = playPauseBtn.querySelector('.pause-icon');
                                if (playIcon) playIcon.style.display = 'none';
                                if (pauseIcon) pauseIcon.style.display = 'block';
                            }
                        }).catch(ex=>console.error('Audio play() failed:',ex));
                        playerState.currentAudio = audio;
                        playerState.currentPlaying = playlistId;
                    } catch(err) {console.error(err);}
                }
            }
        });
        // --- Bind play/pause main player controls ---
        document.querySelectorAll('.play-pause-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const player = btn.closest('.spotify-player');
                const playlistId = player?.id.replace('-player', '');
                const audio = document.getElementById(`${playlistId}-audio`);
                const playBtn = document.querySelector(`.spotify-play-btn[data-playlist-id="${playlistId}"]`);
                if (!audio) return;
                if (audio.paused) {
                    pauseAllAudios(playlistId);
                    try {
                        audio.play().then(()=>{
                            btn.querySelector('.play-icon').style.display = 'none';
                            btn.querySelector('.pause-icon').style.display = 'block';
                            if (playBtn) playBtn.style.display = 'none';
                        }).catch(ex=>console.error('Audio play() failed:', ex));
                        playerState.currentAudio = audio;
                        playerState.currentPlaying = playlistId;
                    } catch(ex){console.error(ex);}
                } else {
                    try {
                        audio.pause();
                        btn.querySelector('.play-icon').style.display = 'block';
                        btn.querySelector('.pause-icon').style.display = 'none';
                        if (playBtn) playBtn.style.display = 'flex';
                    } catch(ex){console.error(ex);}
                }
            }
        });
        // --- Bind next/prev track controls ---
        document.querySelectorAll('.prev-btn, .next-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const isNext = btn.classList.contains('next-btn');
                const player = btn.closest('.spotify-player');
                const playlistId = player?.id.replace('-player', '');
                const card = document.querySelector(`[data-playlist-id="${playlistId}"]`);
                const audio = document.getElementById(`${playlistId}-audio`);
                const tracks = card?.querySelectorAll('.playlist-tracks li') || [];
                let idx = 0;
                let arr = Array.from(tracks);
                // Track index bookkeeping
                if (playerState.currentPlaying === playlistId && playerState.currentAudio) {
                    idx = playerState.currentTrackIndex;
                }
                if (isNext) idx = (idx+1)%arr.length; else idx = (idx-1+arr.length)%arr.length;
                playerState.currentTrackIndex = idx;
                const newTrack = arr[idx];
                if (!newTrack) return;
                audio.src = newTrack.getAttribute('data-track-url');
                try { audio.play(); } catch(err){}
                // Update display
                const trackRegion = player.querySelector('.spotify-current-track-name');
                if (trackRegion) trackRegion.textContent = newTrack.textContent.trim();
                // Fix pause/play ui
                const playPauseBtn = player.querySelector('.play-pause-btn');
                if (playPauseBtn) {
                    playPauseBtn.querySelector('.play-icon').style.display = 'none';
                    playPauseBtn.querySelector('.pause-icon').style.display = 'block';
                }
                if (document.querySelector(`.spotify-play-btn[data-playlist-id="${playlistId}"]`))
                    document.querySelector(`.spotify-play-btn[data-playlist-id="${playlistId}"]`).style.display = 'none';
            }
        });
        // --- Bind progress and volume as before ---
        document.querySelectorAll('.spotify-progress-bar').forEach(bar => {
            bar.onclick = function(e) {
                const playlistId = bar.closest('.spotify-player').id.replace('-player', '');
                const audio = document.getElementById(`${playlistId}-audio`);
                if (!audio) return;
                const rect = bar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = (clickX / rect.width) * 100;
                const newTime = (audio.duration / 100) * percentage;
                audio.currentTime = newTime;
            }
        });
        document.querySelectorAll('.spotify-volume-bar').forEach(bar => {
            bar.onclick = function(e) {
                const playlistId = bar.closest('.spotify-player').id.replace('-player', '');
                const audio = document.getElementById(`${playlistId}-audio`);
                if (!audio) return;
                const rect = bar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                audio.volume = percentage / 100;
                const volumeFill = bar.querySelector('.spotify-volume-fill');
                if (volumeFill) volumeFill.style.width = `${percentage}%`;
            }
        });
    },

    /**
     * Start playback
     */
    startPlayback(playlistId, player, playPauseBtn, audio, playBtn, card, state) {
        // Stop any current playback
        this.stopCurrentPlayback(state);
        
        state.currentPlaying = playlistId;
        state.currentAudio = audio;
        
        // Show player (always visible), hide play button
        player.style.display = 'block';
        playBtn.style.display = 'none';
        
        // Update play/pause button
        const playIcon = playPauseBtn.querySelector('.play-icon');
        const pauseIcon = playPauseBtn.querySelector('.pause-icon');
        if (playIcon) playIcon.style.display = 'none';
        if (pauseIcon) pauseIcon.style.display = 'block';
        
        // Get tracks from playlist
        const tracks = card?.querySelectorAll('.playlist-tracks li') || [];
        state.currentPlaylistTracks = Array.from(tracks).map((li) => {
            // Get track URL from data attribute or text content
            const trackUrl = li.dataset.trackUrl || '';
            return {
                name: li.textContent.trim(),
                url: trackUrl
            };
        });
        state.currentTrackIndex = 0;
        
        // Update current track display
        this.updateCurrentTrackDisplay(playlistId, card, state.currentPlaylistTracks[0], state);
        
        // Set initial track URL if available
        if (state.currentPlaylistTracks.length > 0 && state.currentPlaylistTracks[0].url) {
            if (audio) {
                audio.src = state.currentPlaylistTracks[0].url;
                audio.load();
            }
        }
        
        // Load and play audio
        if (audio) {
            audio.volume = 0.7; // Default volume
            audio.play().then(() => {
                this.updateProgress(playlistId, state);
                this.startProgressTracking(playlistId, state);
            }).catch(error => {
                console.error('Error playing audio:', error);
                // Fallback: simulate playback if audio fails
                this.simulatePlayback(playlistId, state);
            });
        } else {
            // Fallback: simulate playback
            this.simulatePlayback(playlistId, state);
        }
    },
    
    /**
     * Update current track display
     */
    updateCurrentTrackDisplay(playlistId, card, track, state) {
        const currentTrackEl = document.getElementById(`${playlistId}-current-track`);
        const trackNameEl = document.getElementById(`${playlistId}-track-name`);
        const playlistImage = card?.querySelector('.spotify-playlist-placeholder')?.textContent || '🎵';
        
        if (currentTrackEl) {
            currentTrackEl.style.display = 'flex';
            const iconEl = currentTrackEl.querySelector('.spotify-current-track-icon');
            if (iconEl) iconEl.textContent = playlistImage;
        }
        
        if (trackNameEl && track) {
            trackNameEl.textContent = track.name || 'Unknown Track';
        }
    },

    /**
     * Pause playback
     */
    pausePlayback(state) {
        if (state.currentAudio) {
            state.currentAudio.pause();
        }
        
        if (state.progressInterval) {
            clearInterval(state.progressInterval);
            state.progressInterval = null;
        }
        
        if (state.currentPlaying) {
            const player = document.getElementById(`${state.currentPlaying}-player`);
            const playPauseBtn = player?.querySelector('.play-pause-btn');
            const playBtn = document.querySelector(`.spotify-play-btn[data-playlist-id="${state.currentPlaying}"]`);
            const playIcon = playPauseBtn?.querySelector('.play-icon');
            const pauseIcon = playPauseBtn?.querySelector('.pause-icon');
            
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
            if (playBtn) playBtn.style.display = 'flex'; // Show play button when paused
        }
        
        // Keep player visible when paused
        return true;
    },

    /**
     * Resume playback
     */
    resumePlayback(state) {
        if (state.currentAudio) {
            state.currentAudio.play().then(() => {
                this.startProgressTracking(state.currentPlaying, state);
            }).catch(error => {
                console.error('Error resuming audio:', error);
            });
        } else {
            this.simulatePlayback(state.currentPlaying, state);
        }
        
        if (state.currentPlaying) {
            const player = document.getElementById(`${state.currentPlaying}-player`);
            const playPauseBtn = player?.querySelector('.play-pause-btn');
            const playBtn = document.querySelector(`.spotify-play-btn[data-playlist-id="${state.currentPlaying}"]`);
            const playIcon = playPauseBtn?.querySelector('.play-icon');
            const pauseIcon = playPauseBtn?.querySelector('.pause-icon');
            
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (playBtn) playBtn.style.display = 'none';
        }
    },

    /**
     * Stop current playback
     */
    stopCurrentPlayback(state) {
        if (state.currentAudio) {
            state.currentAudio.pause();
            state.currentAudio.currentTime = 0;
            state.currentAudio = null;
        }
        
        if (state.progressInterval) {
            clearInterval(state.progressInterval);
            state.progressInterval = null;
        }
        
        if (state.currentPlaying) {
            const player = document.getElementById(`${state.currentPlaying}-player`);
            const playBtn = document.querySelector(`.spotify-play-btn[data-playlist-id="${state.currentPlaying}"]`);
            const currentTrackEl = document.getElementById(`${state.currentPlaying}-current-track`);
            
            if (player) player.style.display = 'block'; // Keep player visible
            if (playBtn) playBtn.style.display = 'flex';
            if (currentTrackEl) currentTrackEl.style.display = 'none';
            
            // Reset play/pause button
            const playPauseBtn = player?.querySelector('.play-pause-btn');
            const playIcon = playPauseBtn?.querySelector('.play-icon');
            const pauseIcon = playPauseBtn?.querySelector('.pause-icon');
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
        }
        
        state.currentPlaying = null;
    },

    /**
     * Load track
     */
    loadTrack(track, state) {
        if (!state.currentAudio || !track) return;
        
        // Update current track display
        const card = document.querySelector(`[data-playlist-id="${state.currentPlaying}"]`);
        if (card) {
            this.updateCurrentTrackDisplay(state.currentPlaying, card, track, state);
        }
        
        state.currentAudio.src = track.url;
        state.currentAudio.load();
        state.currentAudio.play().then(() => {
            this.updateProgress(state.currentPlaying, state);
            this.startProgressTracking(state.currentPlaying, state);
        }).catch(error => {
            console.error('Error loading track:', error);
        });
    },

    /**
     * Start progress tracking
     */
    startProgressTracking(playlistId, state) {
        if (state.progressInterval) clearInterval(state.progressInterval);
        
        state.progressInterval = setInterval(() => {
            this.updateProgress(playlistId, state);
        }, 100);
    },

    /**
     * Update progress display
     */
    updateProgress(playlistId, state) {
        if (!playlistId) return;
        
        const player = document.getElementById(`${playlistId}-player`);
        if (!player) return;
        
        const progressFill = player.querySelector('.spotify-progress-fill');
        const currentTimeEl = player.querySelector('.current-time');
        const totalTimeEl = player.querySelector('.total-time');
        
        if (state.currentAudio && !isNaN(state.currentAudio.duration)) {
            const current = state.currentAudio.currentTime || 0;
            const total = state.currentAudio.duration || 0;
            const percentage = total > 0 ? (current / total) * 100 : 0;
            
            if (progressFill) progressFill.style.width = `${percentage}%`;
            if (currentTimeEl) currentTimeEl.textContent = this.formatTime(Math.floor(current));
            if (totalTimeEl) totalTimeEl.textContent = this.formatTime(Math.floor(total));
            
            // Auto-advance to next track when finished
            if (current >= total && total > 0 && current > 0) {
                if (state.currentPlaylistTracks.length > 0) {
                    state.currentTrackIndex = (state.currentTrackIndex + 1) % state.currentPlaylistTracks.length;
                    this.loadTrack(state.currentPlaylistTracks[state.currentTrackIndex], state);
                } else {
                    this.stopCurrentPlayback(state);
                }
            }
        } else {
            // Fallback: simulate progress
            if (progressFill && !progressFill.dataset.simulating) {
                this.simulatePlayback(playlistId, state);
            }
        }
    },

    /**
     * Simulate playback (fallback when audio not available)
     */
    simulatePlayback(playlistId, state) {
        const player = document.getElementById(`${playlistId}-player`);
        if (!player) return;
        
        const progressFill = player.querySelector('.spotify-progress-fill');
        const currentTimeEl = player.querySelector('.current-time');
        const totalTimeEl = player.querySelector('.total-time');
        
        if (progressFill) progressFill.dataset.simulating = 'true';
        
        let currentProgress = 0;
        const totalTime = 180; // 3 minutes
        
        if (totalTimeEl) totalTimeEl.textContent = this.formatTime(totalTime);
        
        if (state.progressInterval) clearInterval(state.progressInterval);
        state.progressInterval = setInterval(() => {
            currentProgress += 1;
            const percentage = (currentProgress / totalTime) * 100;
            if (progressFill) progressFill.style.width = `${percentage}%`;
            if (currentTimeEl) currentTimeEl.textContent = this.formatTime(currentProgress);
            
            if (currentProgress >= totalTime) {
                clearInterval(state.progressInterval);
                state.progressInterval = null;
                if (progressFill) delete progressFill.dataset.simulating;
            }
        }, 1000);
    },

    /**
     * Format time in MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

/**
 * Twitter API Integration
 */
const TwitterAPI = {
    /**
     * Search tweets by keyword (using public API or mock data)
     * @param {string} keyword - Search keyword
     * @returns {Promise<Array>} Array of tweets
     */
    async searchTweets(keyword) {
        // Note: Twitter API v2 requires authentication
        // For demo, using mock data or public API alternatives
        if (!keyword || keyword.trim() === '') {
            return [];
        }

        try {
            // Try to use Twitter API if token is configured
            if (API_CONFIG.TWITTER_BEARER_TOKEN && API_CONFIG.TWITTER_BEARER_TOKEN !== 'YOUR_TWITTER_BEARER_TOKEN') {
                try {
                    const response = await fetch(
                        `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(keyword)}&max_results=10&tweet.fields=created_at,author_id,public_metrics`,
                        {
                            headers: {
                                'Authorization': `Bearer ${API_CONFIG.TWITTER_BEARER_TOKEN}`
                            }
                        }
                    );
                    
                    if (response.ok) {
                        const data = await response.json();
                        return data.data || [];
                    }
                } catch (error) {
                    console.warn('Twitter API failed, using fallback:', error);
                }
            }

            // Fallback: Generate mock tweets based on keyword
            return this.generateMockTweets(keyword);
        } catch (error) {
            console.error('Error searching tweets:', error);
            return this.generateMockTweets(keyword);
        }
    },

    /**
     * Generate mock tweets for demo purposes
     * @param {string} keyword - Search keyword
     * @returns {Array} Array of mock tweets
     */
    generateMockTweets(keyword) {
        const mockUsers = [
            { name: 'WebDev Pro', username: '@webdevpro', avatar: '👨‍💻' },
            { name: 'Code Master', username: '@codemaster', avatar: '👩‍💻' },
            { name: 'Tech Enthusiast', username: '@techlover', avatar: '🚀' },
            { name: 'JavaScript Guru', username: '@jsguru', avatar: '⚡' },
            { name: 'React Dev', username: '@reactdev', avatar: '⚛️' }
        ];

        const mockTweets = [
            `Just learned about ${keyword}! This is amazing! 🎉`,
            `Working on a new project using ${keyword}. The possibilities are endless! 💡`,
            `${keyword} has completely changed how I approach development. Game changer! 🚀`,
            `Anyone else excited about ${keyword}? Let's discuss! 💬`,
            `Tutorial on ${keyword} coming soon! Stay tuned 📚`,
            `Just built something awesome with ${keyword}. Check it out! 🔥`,
            `${keyword} is the future of web development. Change my mind! 💪`,
            `Deep dive into ${keyword} - what I learned today 🧠`,
            `Sharing my ${keyword} journey. Day 1 of 30! 📅`,
            `Pro tip: Master ${keyword} and you'll level up your skills! ⭐`
        ];

        return mockTweets.map((text, index) => {
            const user = mockUsers[index % mockUsers.length];
            const hoursAgo = Math.floor(Math.random() * 24);
            const minutesAgo = Math.floor(Math.random() * 60);
            
            return {
                id: `tweet_${Date.now()}_${index}`,
                text: text,
                author_id: user.username,
                created_at: new Date(Date.now() - (hoursAgo * 60 + minutesAgo) * 60 * 1000).toISOString(),
                public_metrics: {
                    retweet_count: Math.floor(Math.random() * 100),
                    like_count: Math.floor(Math.random() * 500),
                    reply_count: Math.floor(Math.random() * 50)
                },
                user: {
                    name: user.name,
                    username: user.username,
                    profile_image_url: user.avatar
                }
            };
        });
    },

    /**
     * Format tweet time
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted time string
     */
    formatTweetTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    },

    /**
     * Render tweets
     * @param {HTMLElement} container - Container element
     * @param {Array} tweets - Array of tweets
     */
    renderTweets(container, tweets) {
        if (!container) return;

        if (tweets.length === 0) {
            container.innerHTML = '<p class="no-tweets">No tweets found. Try a different keyword.</p>';
            return;
        }

        let html = '<div class="tweets-grid">';
        tweets.forEach(tweet => {
            const time = this.formatTweetTime(tweet.created_at);
            html += `
                <article class="tweet-card">
                    <div class="tweet-header">
                        <div class="tweet-avatar">${tweet.user?.profile_image_url || '👤'}</div>
                        <div class="tweet-user-info">
                            <div class="tweet-name">${tweet.user?.name || 'User'}</div>
                            <div class="tweet-username">${tweet.user?.username || '@user'}</div>
                        </div>
                        <div class="tweet-time">${time}</div>
                    </div>
                    <div class="tweet-content">
                        ${this.formatTweetText(tweet.text)}
                    </div>
                    <div class="tweet-actions">
                        <button class="tweet-action-btn" aria-label="Reply">
                            <span class="tweet-icon">💬</span>
                            <span class="tweet-count">${tweet.public_metrics?.reply_count || 0}</span>
                        </button>
                        <button class="tweet-action-btn" aria-label="Retweet">
                            <span class="tweet-icon">🔄</span>
                            <span class="tweet-count">${tweet.public_metrics?.retweet_count || 0}</span>
                        </button>
                        <button class="tweet-action-btn" aria-label="Like">
                            <span class="tweet-icon">❤️</span>
                            <span class="tweet-count">${tweet.public_metrics?.like_count || 0}</span>
                        </button>
                        <button class="tweet-action-btn" aria-label="Share">
                            <span class="tweet-icon">📤</span>
                        </button>
                    </div>
                </article>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    },

    /**
     * Format tweet text (handle mentions, hashtags, links)
     * @param {string} text - Tweet text
     * @returns {string} Formatted HTML
     */
    formatTweetText(text) {
        return text
            .replace(/(@\w+)/g, '<span class="tweet-mention">$1</span>')
            .replace(/(#\w+)/g, '<span class="tweet-hashtag">$1</span>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="tweet-link">$1</a>');
    },

    /**
     * Display tweets in container
     * @param {HTMLElement} container - Container element
     * @param {string} keyword - Search keyword
     */
    async displayTweets(container, keyword = 'webdev') {
        if (!container) return;

        const loadingEl = document.getElementById('twitter-loading');
        
        try {
            // Clear previous tweets
            container.innerHTML = '';
            
            if (loadingEl) {
                loadingEl.style.display = 'block';
                loadingEl.textContent = 'Loading tweets...';
            }
            
            // Add small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const tweets = await this.searchTweets(keyword);
            
            if (loadingEl) loadingEl.style.display = 'none';
            
            this.renderTweets(container, tweets);
        } catch (error) {
            console.error('Error displaying tweets:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            container.innerHTML = `
                <div class="error-message">
                    <p>Unable to load tweets. Please try again later.</p>
                    <p class="error-detail">${error.message || 'Unknown error'}</p>
                </div>
            `;
        }
    }
};

// Export for use in other scripts
window.MapsAPI = MapsAPI;
window.MusicAPI = MusicAPI;
window.TwitterAPI = TwitterAPI;

