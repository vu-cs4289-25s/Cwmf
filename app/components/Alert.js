// components/Alert.js 
import { useState, useEffect } from 'react';

export default function Alert({ message, subtitle, duration = 2000, onDismiss }) {
    // No local state - completely controlled by parent

    useEffect(() => {
        // Simply call onDismiss after duration
        const timer = setTimeout(() => {
            if (onDismiss) {
                onDismiss();
            }
        }, duration);

        return () => clearTimeout(timer);
    }, []);  // Empty dependency array - run only once when mounted

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg max-w-md mx-4">
                <div className="flex items-center">
                    <div className="text-lg font-bold">{message}</div>
                </div>
                {subtitle && <div className="mt-2">{subtitle}</div>}
            </div>
        </div>
    );
}