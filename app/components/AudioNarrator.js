// components/AudioNarrator.js
// Audio version of the Narrator component that uses PlayHT for TTS
import React, { useState, useEffect, useRef } from "react";

const AudioNarrator = ({
    stage,
    currentRound,
    theme,
    prompt,
    timeLeft,
    submissions = [],
    isActive = true,
    singleLine = false,
    message = null, // Allow passing a specific message
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [audioReady, setAudioReady] = useState(false);
    const [currentMessage, setCurrentMessage] = useState(message);
    const audioRef = useRef(null);
    const messageRef = useRef(message);
    const processingMessageRef = useRef(false);

    // Update messageRef when message changes
    useEffect(() => {
        if (message !== messageRef.current) {
            messageRef.current = message;
            setCurrentMessage(message);
            setHasGenerated(false);
            setAudioReady(false);
        }
    }, [message]);

    // Map stage to appropriate emotion
    const getEmotionForStage = (stage) => {
        switch (stage) {
            case "PREP":
                return "excited";
            case "GAME":
                return "excited";
            case "VOTING":
                return "excited";
            case "RESULTS":
                return "excited";
            default:
                return "excited";
        }
    };

    // Only generate audio when we have a message that hasn't been processed yet
    useEffect(() => {
        const generateAudio = async () => {
            // Don't generate if we're already processing, or no message, or not active, or already generated for this message
            if (processingMessageRef.current || !currentMessage || !isActive || hasGenerated) return;

            // Set processing flag to prevent concurrent requests
            processingMessageRef.current = true;
            setIsLoading(true);
            setError(null);

            try {
                console.log('Generating audio for message:', currentMessage);

                // Strip emojis for better TTS
                const cleanMessage = currentMessage.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

                // Get the appropriate emotion for this stage
                const emotion = getEmotionForStage(stage);
                console.log(`Using emotion "${emotion}" for stage "${stage}"`);

                const response = await fetch('/api/generate-audio', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: cleanMessage,
                        voice: process.env.NEXT_PUBLIC_PLAYHT_VOICE_ID, // Professor's voice ID
                        speed: 1.0,
                        emotion: emotion // Use the determined emotion
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Failed to generate audio:', errorText);
                    throw new Error(`Failed to generate audio: ${errorText}`);
                }

                const data = await response.json();

                if (!data.audioUrl) {
                    throw new Error('No audio URL in response');
                }

                console.log('Audio generated successfully:', data.audioUrl);
                setAudioUrl(data.audioUrl);
                setAudioReady(true);
                setHasGenerated(true);
            } catch (error) {
                console.error('Error generating audio:', error);
                setError(`Error: ${error.message}`);
            } finally {
                setIsLoading(false);
                processingMessageRef.current = false;
            }
        };

        generateAudio();
    }, [currentMessage, isActive, hasGenerated, stage]);

    // Play audio when it's ready
    useEffect(() => {
        if (audioReady && audioRef.current && !isPlaying) {
            audioRef.current.load();

            // Use a timeout to ensure audio has loaded before playing
            setTimeout(() => {
                // Set volume to make it a bit louder
                if (audioRef.current) {
                    audioRef.current.volume = 1.0; // Max volume

                    audioRef.current.play()
                        .then(() => {
                            console.log('Audio playback started');
                            setIsPlaying(true);
                        })
                        .catch(err => {
                            console.error('Error playing audio:', err);
                            setError('Failed to play audio');
                        });
                }
            }, 100);

            // Mark as no longer ready to avoid repeated play attempts
            setAudioReady(false);
        }
    }, [audioReady, isPlaying]);

    // Handle audio events
    const handleAudioEnd = () => {
        console.log('Audio playback ended');
        setIsPlaying(false);
    };

    const handleAudioPlay = () => {
        console.log('Audio playback started');
        setIsPlaying(true);
    };

    const handleAudioPause = () => {
        console.log('Audio playback paused');
        setIsPlaying(false);
    };

    // Function to manually play/pause audio
    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                // Set maximum volume when manually playing
                audioRef.current.volume = 1.0;

                audioRef.current.play()
                    .catch(err => {
                        console.error('Error playing audio:', err);
                        setError('Failed to play audio');
                    });
            }
        }
    };

    // If there's no message or we're not active, don't render anything
    if (!currentMessage || !isActive) return null;

    return (
        <div className="fixed bottom-24 left-0 right-0 z-50">
            <div className="max-w-md mx-auto bg-off-white rounded-lg shadow-lg p-4 transform transition-all duration-600 hover:scale-105">
                <div className="flex items-center justify-center space-x-2">
                    <button
                        onClick={toggleAudio}
                        disabled={isLoading || !audioUrl}
                        className="p-2 rounded-full bg-primary-blue text-off-white hover:bg-hover-blue transition-colors"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </button>

                    <span className="text-2xl">🤖</span>

                    <p className="text-xl font-sans text-primary-blue font-semibold">
                        {currentMessage}
                    </p>
                </div>

                {error && (
                    <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
                )}

                {audioUrl && (
                    <audio
                        ref={audioRef}
                        onEnded={handleAudioEnd}
                        onPlay={handleAudioPlay}
                        onPause={handleAudioPause}
                        className="hidden"
                    >
                        <source src={audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                    </audio>
                )}
            </div>
        </div>
    );
};

export default AudioNarrator;