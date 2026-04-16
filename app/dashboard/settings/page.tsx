'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    weeklyDigest: true,
    marketingEmails: false,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    dataSharing: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (section: string) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    toast.success(`${section} settings saved`);
    setSaving(false);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
      />
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account preferences and privacy</p>
      </div>

      <div className="space-y-6">

        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Notifications</h2>
          <p className="text-sm text-gray-500 mb-5">Choose how you want to be notified</p>
          <div className="space-y-4">
            {[
              { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive email notifications for important updates' },
              { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Get SMS for critical financial alerts' },
              { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
              { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary of your financial overview' },
              { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Updates on new products and promotions' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <Toggle
                  checked={notifications[key as keyof typeof notifications]}
                  onChange={(v) => setNotifications(n => ({ ...n, [key]: v }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => handleSave('Notification')}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              {saving ? 'Saving...' : 'Save Notifications'}
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Privacy</h2>
          <p className="text-sm text-gray-500 mb-5">Control your data and visibility</p>
          <div className="space-y-4">
            {[
              { key: 'profileVisible', label: 'Profile Visibility', desc: 'Allow your advisor to view your profile and financial data' },
              { key: 'dataSharing', label: 'Anonymous Data Sharing', desc: 'Share anonymised data to improve CFP Malaysia services' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <Toggle
                  checked={privacy[key as keyof typeof privacy]}
                  onChange={(v) => setPrivacy(n => ({ ...n, [key]: v }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => handleSave('Privacy')}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
            >
              {saving ? 'Saving...' : 'Save Privacy'}
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Account</h2>
          <p className="text-sm text-gray-500 mb-5">Manage your account access</p>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Change Password</p>
                <p className="text-xs text-gray-500">Update your account password</p>
              </div>
              <span className="text-gray-400">→</span>
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-red-50 transition flex items-center justify-between group">
              <div>
                <p className="text-sm font-medium text-red-600 group-hover:text-red-700">Delete Account</p>
                <p className="text-xs text-gray-500">Permanently delete your account and all data</p>
              </div>
              <span className="text-red-400 group-hover:text-red-600">→</span>
            </button>
          </div>
        </div>

        {/* About */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">About</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>App Version</span>
              <span className="font-mono text-gray-800">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>License</span>
              <span className="font-mono text-gray-800">CFP Malaysia © 2026</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
