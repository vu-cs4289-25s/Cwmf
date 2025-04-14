// utils/musicService.js
class MusicService {
    constructor() {
        // Track current audio element
        this.currentAudio = null;

        // Keep track of loaded music
        this.tracks = {
            PREP: null,
            GAME: null,
            VOTING: null,
            RESULTS: null,
            GAME_OVER: null,
            default: null
        };


        // Music path mapping using fallback for now
        this.musicPaths = {
            PREP: "/music/game.mp3",
            GAME: "/music/suspense.mp3",
            VOTING: "/music/voting.mp3",
            RESULTS: "/music/game.mp3",
            GAME_OVER: "/music/gameover.mp3",
            default: "/music/game.mp3"
        };

        // Settings
        this.volume = 0.2;
        this.isEnabled = true;
        this.isMuted = false;

        // Load settings from localStorage if available
        if (typeof window !== 'undefined') {
            const storedVolume = localStorage.getItem('backgroundMusicVolume');
            if (storedVolume !== null) {
                this.volume = parseFloat(storedVolume);
            }

            const storedEnabled = localStorage.getItem('backgroundMusicEnabled');
            if (storedEnabled !== null) {
                this.isEnabled = storedEnabled === 'true';
            }

            const storedMuted = localStorage.getItem('backgroundMusicMuted');
            if (storedMuted !== null) {
                this.isMuted = storedMuted === 'true';
            }
        }
    }

    // Preload all audio files
    preloadAllTracks() {
        if (typeof window === 'undefined') return; // Skip in SSR

        // Preload only one track to save resources
        this.preloadTrack('default');
        console.log("Preloaded default music track");
    }

    // Preload a specific track
    preloadTrack(stage) {
        if (typeof window === 'undefined') return; // Skip in SSR

        const path = this.musicPaths[stage];
        if (!path) {
            console.log(`No path defined for stage: ${stage}`);
            return;
        }

        try {
            // Create audio element if not already cached
            if (!this.tracks[stage]) {
                console.log(`Creating audio element for stage: ${stage}, path: ${path}`);
                const audio = new Audio();
                audio.preload = 'auto';
                audio.loop = true;
                audio.volume = this.volume;
                audio.muted = this.isMuted;

                // Add error handling
                audio.onerror = (e) => {
                    console.error(`Error loading audio for stage ${stage}:`, e);
                };

                // Set the source after adding error handler
                audio.src = path;

                // Store the element
                this.tracks[stage] = audio;

                console.log(`Preloaded music for stage: ${stage}`);
            }
        } catch (error) {
            console.error(`Error preloading track for ${stage}:`, error);
        }
    }

    // Play music for a specific stage
    playMusic(stage) {
        if (typeof window === 'undefined') return;

        try {
            console.log("Playing music for stage:", stage);
            console.log("Current tracks:", Object.keys(this.tracks).filter(key => this.tracks[key] !== null));

            // Don't stop the current track if it's the same stage
            if (this.currentAudio && this.currentAudio._stage === stage) {
                return;
            }

            // Stop current audio with a small delay
            if (this.currentAudio) {
                const oldAudio = this.currentAudio;
                this.currentAudio = null; // Clear reference first

                // Small delay before stopping
                setTimeout(() => {
                    try {
                        oldAudio.pause();
                        oldAudio.currentTime = 0;
                    } catch (error) {
                        console.error("Error stopping previous track:", error);
                    }
                }, 50);
            }

            // Delay before playing new audio
            setTimeout(() => {
                // IMPORTANT: Make sure the track is loaded FIRST
                this.preloadTrack(stage);

                // THEN check if it exists, fallback to default only if still not available
                const targetStage = this.tracks[stage] ? stage : 'default';

                console.log(`After preloading, using track for stage: ${targetStage}`);

                const audio = this.tracks[targetStage];
                if (audio) {
                    // Update volume and mute settings
                    audio.volume = this.volume;
                    audio.muted = this.isMuted;

                    // Reset to beginning
                    audio.currentTime = 0;

                    // Store which stage this audio is for
                    audio._stage = targetStage;

                    // Play if enabled and not muted
                    if (this.isEnabled && !this.isMuted) {
                        const playPromise = audio.play();

                        // Handle the play promise correctly
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                // Handle specific errors quietly
                                if (error.name !== 'NotAllowedError') {
                                    console.error(`Error playing music for stage ${stage}:`, error);
                                }
                            });
                        }
                    }

                    // Update current audio reference
                    this.currentAudio = audio;

                    console.log(`Playing music for stage: ${targetStage}`);
                }
            }, 100); // Small delay before playing new audio
        } catch (error) {
            console.error(`Error in playMusic for stage ${stage}:`, error);
        }
    }

    // Stop the currently playing track
    stopCurrentTrack() {
        if (this.currentAudio) {
            try {
                // Use a try-catch to handle any errors during pause
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            } catch (error) {
                console.error("Error stopping current track:", error);
            }
            this.currentAudio = null;
        }
    }

    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = volume;

        // Update volume for all tracks
        Object.values(this.tracks).forEach(audio => {
            if (audio) {
                try {
                    audio.volume = volume;
                } catch (error) {
                    console.error("Error setting volume:", error);
                }
            }
        });

        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('backgroundMusicVolume', volume.toString());
        }
    }

    // Enable/disable music
    setEnabled(enabled) {
        this.isEnabled = enabled;

        if (enabled && !this.isMuted && this.currentAudio) {
            try {
                const playPromise = this.currentAudio.play();

                // Handle the play promise
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Only log errors other than NotAllowedError
                        if (error.name !== 'NotAllowedError') {
                            console.error("Error playing background music:", error);
                        }
                    });
                }
            } catch (error) {
                console.error("Error in setEnabled:", error);
            }
        } else if (!enabled && this.currentAudio) {
            try {
                this.currentAudio.pause();
            } catch (error) {
                console.error("Error pausing in setEnabled:", error);
            }
        }

        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('backgroundMusicEnabled', enabled.toString());
        }
    }

    // Mute/unmute music
    setMuted(muted) {
        this.isMuted = muted;

        // Update mute status for all tracks
        Object.values(this.tracks).forEach(audio => {
            if (audio) {
                try {
                    audio.muted = muted;
                } catch (error) {
                    console.error("Error setting mute:", error);
                }
            }
        });

        // If unmuting and playing, make sure audio is playing
        if (!muted && this.isEnabled && this.currentAudio) {
            try {
                const playPromise = this.currentAudio.play();

                // Handle the play promise
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Only log errors other than NotAllowedError
                        if (error.name !== 'NotAllowedError') {
                            console.error("Error playing in setMuted:", error);
                        }
                    });
                }
            } catch (error) {
                console.error("Error in setMuted:", error);
            }
        }

        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('backgroundMusicMuted', muted.toString());
        }
    }

    // Toggle music enabled state
    toggleEnabled() {
        this.setEnabled(!this.isEnabled);
        return this.isEnabled;
    }

    // Toggle mute state
    toggleMuted() {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }

    // Get current settings
    getSettings() {
        return {
            volume: this.volume,
            isEnabled: this.isEnabled,
            isMuted: this.isMuted
        };
    }
}

// Create singleton instance
const musicService = typeof window !== 'undefined' ? new MusicService() : null;

export default musicService;