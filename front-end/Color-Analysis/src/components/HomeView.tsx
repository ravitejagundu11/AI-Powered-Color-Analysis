import type { JSX } from 'react';

interface HomeViewProps {
    onGetStarted: () => void;
}

export default function HomeView({ onGetStarted }: HomeViewProps): JSX.Element {
    return (
        <div className="w-full max-w-2xl flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="text-center space-y-8">
                {/* Title */}
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
                    AI Skintone Analysis
                </h1>

                {/* Greeting */}
                <p className="text-2xl md:text-3xl text-gray-600 font-light">
                    Hello!
                </p>

                {/* Description */}
                <p className="text-lg text-gray-500 max-w-md mx-auto">
                    Discover your perfect color palette with AI-powered seasonal color analysis
                </p>

                {/* Get Started Button */}
                <button
                    onClick={onGetStarted}
                    className="mt-8 px-12 py-4 bg-black text-white text-lg font-medium rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
                >
                    Get Started
                </button>
            </div>
        </div>
    );
}
