import GuestLayout from '@/Layouts/GuestLayout';
import PalaceInput from '@/Components/PalaceInput';
import PalaceButton from '@/Components/PalaceButton';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-green-400 text-sm">{status}</div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <PalaceInput
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="you@example.com"
                    error={errors.email}
                    autoComplete="username"
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
                    placeholder="Your password"
                    error={errors.password}
                    autoComplete="current-password"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    }
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            className="palace-checkbox"
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        <span className="ms-2 text-sm text-white/80">Remember me</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="palace-link text-sm"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <PalaceButton 
                    type="submit" 
                    className="w-full" 
                    disabled={processing}
                    loading={processing}
                >
                    Sign in
                </PalaceButton>

                <div className="text-center">
                    <span className="text-white/70 text-sm">Don't have an account?</span>
                    <Link href={route('register')} className="ml-2 palace-link text-sm">
                        Create your palace
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
