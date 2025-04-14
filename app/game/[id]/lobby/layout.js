
"use client";

import { useState, useEffect } from "react";
import musicService from "../../../utils/musicService";
import { usePathname } from "next/navigation";
import path from "path";

export default function GameLayout({ children }) {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    // Determine current game stage from the URL
    const getCurrentStage = () => {
        console.log('Current pathname:', pathname);

        if (!pathname) return "default";

        // Split the path to get the components
        const pathParts = pathname.split('/').filter(Boolean);

        // Check for specific stages
        if (pathname.includes("/lobby")) {
            return "LOBBY";
        } else if (pathname.includes("/play")) {
            // Check URL to determine more specific stage
            // This depends on how your routes are structured
            // You might need to access this from props or state

            // For example, if you have this pattern: /game/123/play/STAGE_NAME
            if (pathParts.length >= 4) {
                const lastPart = pathParts[pathParts.length - 1];

                // If the last part is a specific stage identifier
                if (lastPart === "prep" || lastPart === "PREP") return "PREP";
                if (lastPart === "voting" || lastPart === "VOTING") return "VOTING";
                if (lastPart === "results" || lastPart === "RESULTS") return "RESULTS";
                if (lastPart === "game-over" || lastPart === "GAME_OVER") return "GAME_OVER";
            }

            // Default to GAME for all other play URLs
            return "GAME";
        }

        return "default";
    };

    // Preload all music when the component mounts
    useEffect(() => {
        if (!mounted) {
            setMounted(true);

            // Only run on client side
            if (typeof window === "undefined") return;

            // Preload all music tracks
            if (musicService) {
                musicService.preloadAllTracks();

                // Start playing music for current stage
                const stage = getCurrentStage();
                musicService.playMusic(stage);
            }
        }
    }, [mounted]);

    //Update music when pathname changes
    useEffect(() => {
        if (mounted && musicService) {
            const stage = getCurrentStage();
            musicService.playMusic(stage);
        }
    }, [pathname, mounted]);

    return (
        <div className="min-h-screen bg-background-blue">
            {children}

            {/* Music Controls - alternative to component-level controls */}
            {mounted && (
                <div className="hidden">
                    {/* This is an invisible div just to ensure music keeps playing */}
                    {/* The actual controls are in the BackgroundMusic component */}
                </div>
            )}
        </div>
    );
}