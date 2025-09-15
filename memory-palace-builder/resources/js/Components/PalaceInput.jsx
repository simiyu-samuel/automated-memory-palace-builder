import React, { forwardRef } from 'react';

const PalaceInput = forwardRef(({
    type = 'text',
    label,
    error,
    success,
    hint,
    className = '',
    containerClassName = '',
    labelClassName = '',
    icon,
    rightIcon,
    ...props
}, ref) => {
    const baseInputClasses = "w-full px-4 py-3 rounded-lg text-white placeholder-white/50 transition-all duration-300 border backdrop-blur-sm";
    
    const stateClasses = error 
        ? "bg-red-500/10 border-red-500/50 focus:border-red-500 focus:ring-red-500/20" 
        : success 
            ? "bg-green-500/10 border-green-500/50 focus:border-green-500 focus:ring-green-500/20"
            : "bg-white/10 border-white/20 focus:border-palace-gold focus:ring-palace-gold/20";
    
    const focusClasses = "focus:outline-none focus:ring-2 focus:ring-offset-0";
    
    const inputClasses = `${baseInputClasses} ${stateClasses} ${focusClasses} ${icon || rightIcon ? 'pl-11' : ''} ${className}`;
    
    return (
        <div className={`space-y-2 ${containerClassName}`}>
            {label && (
                <label className={`block text-sm font-medium text-white/90 ${labelClassName}`}>
                    {label}
                </label>
            )}
            
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <div className="text-white/50 w-5 h-5">
                            {icon}
                        </div>
                    </div>
                )}
                
                <input
                    ref={ref}
                    type={type}
                    className={inputClasses}
                    {...props}
                />
                
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <div className="text-white/50 w-5 h-5">
                            {rightIcon}
                        </div>
                    </div>
                )}
            </div>
            
            {hint && !error && !success && (
                <p className="text-white/60 text-sm">{hint}</p>
            )}
            
            {error && (
                <p className="text-red-400 text-sm flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </p>
            )}
            
            {success && (
                <p className="text-green-400 text-sm flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{success}</span>
                </p>
            )}
        </div>
    );
});

PalaceInput.displayName = 'PalaceInput';

export default PalaceInput;
