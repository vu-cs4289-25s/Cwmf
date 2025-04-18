// components/BackgroundMusic.js
import React, { useState, useEffect, useRef } from "react";
import musicService from "../utils/musicService";

const BackgroundMusic = ({ stage, enabled = true, volume = 0.2 }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentVolume, setCurrentVolume] = useState(volume);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize music settings from service or props
    useEffect(() => {
        if (!isInitialized && musicService) {
            const settings = musicService.getSettings();
            setIsPlaying(settings.isEnabled);
            setIsMuted(settings.isMuted);
            setCurrentVolume(settings.volume);
            setIsInitialized(true);

            // Set up music for this stage
            try {
                musicService.playMusic(stage);
            } catch (error) {
                console.error("Error initializing music:", error);
            }
        }
    }, [stage, enabled, volume, isInitialized]);

    // Update music service when stage changes
    useEffect(() => {
        if (isInitialized && musicService) {
            try {
                musicService.playMusic(stage);
            } catch (error) {
                console.error("Error changing music for stage:", error);
            }
        }
    }, [stage, isInitialized]);

    // Handle play/pause toggle
    const togglePlay = () => {
        if (!musicService) return;

        try {
            const newState = musicService.toggleEnabled();
            setIsPlaying(newState);
        } catch (error) {
            console.error("Error toggling play state:", error);
        }
    };

    // Handle mute toggle
    const toggleMute = () => {
        if (!musicService) return;

        try {
            const newState = musicService.toggleMuted();
            setIsMuted(newState);
        } catch (error) {
            console.error("Error toggling mute state:", error);
        }
    };

    // Handle volume change
    const changeVolume = (e) => {
        if (!musicService) return;

        try {
            const newVolume = parseFloat(e.target.value);
            musicService.setVolume(newVolume);
            setCurrentVolume(newVolume);
        } catch (error) {
            console.error("Error changing volume:", error);
        }
    };

    return (
        <div className="fixed bottom-5 left-5 z-50 flex items-center bg-off-white bg-opacity-80 p-2 rounded-full shadow-lg">
            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-blue text-off-white mr-2 hover:bg-hover-blue transition-colors"
                title={isPlaying ? "Pause music" : "Play music"}
            >
                {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </button>

            {/* Mute Button */}
            <button
                onClick={toggleMute}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-blue text-off-white mr-2 hover:bg-hover-blue transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
            >
                {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                )}
            </button>

            {/* Volume Slider (hidden when muted) */}
            {!isMuted && (
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={currentVolume}
                    onChange={changeVolume}
                    className="w-16 h-1 cursor-pointer"
                    title="Volume"
                />
            )}
        </div>
    );
};

export default BackgroundMusic;