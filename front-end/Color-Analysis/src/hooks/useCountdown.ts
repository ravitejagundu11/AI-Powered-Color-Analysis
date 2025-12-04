import { useState, useEffect, useRef, useCallback } from 'react';
import { COUNTDOWN_START, COUNTDOWN_INTERVAL_MS } from '../constants';

export interface UseCountdownReturn {
    countdown: number | null;
    startCountdown: (onComplete: () => void) => void;
    cancelCountdown: () => void;
}

export function useCountdown(): UseCountdownReturn {
    const [countdown, setCountdown] = useState<number | null>(null);
    const intervalRef = useRef<number | null>(null);
    const onCompleteRef = useRef<(() => void) | null>(null);

    const cancelCountdown = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setCountdown(null);
        onCompleteRef.current = null;
    }, []);

    const startCountdown = useCallback((onComplete: () => void) => {
        // Clear any existing countdown
        cancelCountdown();

        onCompleteRef.current = onComplete;
        setCountdown(COUNTDOWN_START);
        let count = COUNTDOWN_START;

        intervalRef.current = setInterval(() => {
            count -= 1;
            setCountdown(count);

            if (count === 0) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setCountdown(null);
                if (onCompleteRef.current) {
                    onCompleteRef.current();
                    onCompleteRef.current = null;
                }
            }
        }, COUNTDOWN_INTERVAL_MS);
    }, [cancelCountdown]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        countdown,
        startCountdown,
        cancelCountdown
    };
}
