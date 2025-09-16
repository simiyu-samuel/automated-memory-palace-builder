import GuestLayout from '@/Layouts/GuestLayout';
import PalaceInput from '@/Components/PalaceInput';
import PalaceButton from '@/Components/PalaceButton';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'));
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">🚀 Build Your Palace</h2>
                <p className="text-white/70">Create your account and start your memory journey</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <PalaceInput
                    label="Name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Your name"
                    error={errors.name}
                    autoComplete="name"
                    required
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    }
                />

                <PalaceInput
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="you@example.com"
                    error={errors.email}
                    autoComplete="username"
                    required
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                    }
                />

                <PalaceInput
                    label="Password"
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Create a strong password"
                    error={errors.password}
                    autoComplete="new-password"
                    required
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    }
                />

                <PalaceInput
                    label="Confirm Password"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    placeholder="Re-enter your password"
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                    required
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />

                <PalaceButton 
                    type="submit" 
                    className="w-full text-lg py-4"
                    disabled={processing}
                    loading={processing}
                >
                    🏰 Create My Palace
                </PalaceButton>

                <div className="text-center pt-4 border-t border-white/10">
                    <span className="text-white/70 text-sm">Already have an account?</span>
                    <Link href={route('login')} className="ml-2 palace-link text-sm font-semibold">
                        🔑 Sign in to your palace
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
