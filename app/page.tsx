import Link from 'next/link';
import { Shield, BarChart3, Users, Lock, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-indigo-300" />
          <span className="text-white font-bold text-lg">CFP Malaysia</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-indigo-200 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-8 pt-20 pb-28 text-center">
        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Your Financial Future,<br />
          <span className="text-indigo-300">Clear and Confident</span>
        </h1>
        <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto">
          Comprehensive financial planning powered by AI. Track your net worth,
          discover investment opportunities, and achieve your life goals — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-400 text-white rounded-xl font-semibold hover:bg-indigo-300 transition shadow-lg shadow-indigo-900/50"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 border border-indigo-400 text-indigo-200 rounded-xl font-semibold hover:bg-indigo-800/40 transition"
          >
            Sign In
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-12">
            Everything you need for smart financial planning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'Financial Analysis',
                desc: 'Get a clear picture of your net worth, monthly surplus, and emergency fund readiness powered by AI.',
              },
              {
                icon: Users,
                title: 'Personalised Advisory',
                desc: 'Risk profiling and tailored investment recommendations matched to your financial goals and tolerance.',
              },
              {
                icon: Lock,
                title: 'Secure & Private',
                desc: 'Bank-grade encryption for all your documents and data. Your financial information stays yours.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-950 py-6 text-center text-indigo-400 text-sm">
        &copy; {new Date().getFullYear()} CFP Malaysia. All rights reserved.
      </footer>
    </div>
  );
}
