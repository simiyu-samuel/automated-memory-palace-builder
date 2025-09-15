import React from 'react';
import { Link } from '@inertiajs/react';

export default function PalaceButton({
    variant = 'primary',
    size = 'md',
    href,
    as = 'button',
    className = '',
    disabled = false,
    loading = false,
    children,
    ...props
}) {
    const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";
    
    const variants = {
        primary: "bg-gradient-to-r from-palace-gold to-orange-500 text-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-palace-gold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        secondary: "bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:border-white/30 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed",
        ghost: "bg-transparent text-white hover:bg-white/10 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed",
        danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        success: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
    };
    
    const sizes = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg",
    };
    
    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
    
    const content = (
        <>
            {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </>
    );
    
    if (href) {
        return (
            <Link href={href} className={classes} {...props}>
                {content}
            </Link>
        );
    }
    
    if (as === 'button') {
        return (
            <button
                className={classes}
                disabled={disabled || loading}
                {...props}
            >
                {content}
            </button>
        );
    }
    
    const Component = as;
    return (
        <Component className={classes} disabled={disabled || loading} {...props}>
            {content}
        </Component>
    );
}
