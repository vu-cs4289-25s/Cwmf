// hooks/useGameTimer.js
import { useEffect, useState } from 'react';
import { init } from "@instantdb/react";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const db = init({ appId: APP_ID });

export function useGameTimer(initialTime = 30) {
    const [timeLeft, setTimeLeft] = useState(initialTime);

    const { data } = db.useQuery({
        games: {
            $: {
                where: { status: "active" },
            },
        },
    });

    useEffect(() => {
        if (!data?.games?.[0]) return;

        const game = data.games[0];

        // If timer hasn't been initialized yet, initialize it
        if (!game.timerStart && !game.timeLeft) {
            db.transact(db.tx.games[game.id].update({
                timerStart: Date.now(),
                timeLeft: initialTime,
                isTimerRunning: true
            }));
            return;
        }

        // Sync with server timer
        if (game.timerStart && game.isTimerRunning) {
            const elapsed = Math.floor((Date.now() - game.timerStart) / 1000);
            const remaining = Math.max(0, initialTime - elapsed);

            setTimeLeft(remaining);

            // Set up interval to update local timer
            const interval = setInterval(() => {
                setTimeLeft((prev) => {
                    const newTime = Math.max(0, prev - 1);

                    // When timer reaches 0, update game state
                    if (newTime === 0 && game.isTimerRunning) {
                        db.transact(db.tx.games[game.id].update({
                            isTimerRunning: false,
                            timeLeft: 0
                        }));
                        clearInterval(interval);
                    }

                    return newTime;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [data, initialTime]);

    const resetTimer = () => {
        db.transact(db.tx.games[data.games[0].id].update({
            timerStart: Date.now(),
            timeLeft: initialTime,
            isTimerRunning: true
        }));
    };

    const pauseTimer = () => {
        if (!data?.games?.[0]) return;

        db.transact(db.tx.games[data.games[0].id].update({
            timeLeft,
            isTimerRunning: false
        }));
    };

    return {
        timeLeft,
        resetTimer,
        pauseTimer,
        isRunning: data?.games?.[0]?.isTimerRunning || false
    };
}