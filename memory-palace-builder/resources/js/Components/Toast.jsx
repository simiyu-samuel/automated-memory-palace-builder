import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getToastStyles = () => {
        const baseStyles = "fixed top-20 right-4 z-[9999] p-4 rounded-xl shadow-2xl backdrop-blur-sm border transform transition-all duration-300 max-w-sm";
        
        if (!isVisible) {
            return `${baseStyles} translate-x-full opacity-0 scale-95`;
        }

        switch (type) {
            case 'success':
                return `${baseStyles} bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400`;
            case 'error':
                return `${baseStyles} bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400`;
            case 'warning':
                return `${baseStyles} bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-400`;
            case 'info':
            default:
                return `${baseStyles} bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400`;
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            case 'info':
            default:
                return 'ℹ️';
        }
    };

    return (
        <div className={getToastStyles()}>
            <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{getIcon()}</span>
                <div className="flex-1">
                    <p className="font-medium text-sm leading-relaxed">{message}</p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onClose, 300);
                    }}
                    className="text-white/80 hover:text-white transition-colors duration-200 text-lg font-bold leading-none flex-shrink-0"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast;