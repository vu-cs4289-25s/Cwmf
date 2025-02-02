import React, { useState, useEffect } from 'react';

export default function PrepPage() {
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex min-h-screen flex-col">
            <div className="text-center pt-8 pb-0">
                <h1 className="text-center text-4xl py-5">Round 5</h1>
                <h3 className="text-2xl">Theme: Things a pirate would say</h3>
            </div>
            <div className="text-center pt-30 pb-0">
                <h1 className="text-center text-8xl py-5">BBL</h1>
            </div>

            {/* Timer section */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gray-100">
                <div className="max-w-md mx-auto flex flex-col items-center">
                    <div className="text-6xl font-bold">{formatTime(timeLeft)}</div>
                </div>
            </div>
        </div>
    );
}