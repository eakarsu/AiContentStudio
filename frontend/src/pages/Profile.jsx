import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiShield, FiKey, FiUpload, FiTrash2, FiPlus, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import { authApi, apiKeyApi } from '../services/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  // 2FA
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disable2FACode, setDisable2FACode] = useState('');
  // API Keys
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const res = await apiKeyApi.getAll();
      setApiKeys(res.data);
    } catch (e) { /* ignore */ }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile({ name, email });
      if (refreshUser) await refreshUser();
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      await authApi.uploadAvatar(formData);
      if (refreshUser) await refreshUser();
      toast.success('Avatar updated!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    }
  };

  const handle2FASetup = async () => {
    try {
      const res = await authApi.setup2FA();
      setTwoFASetup(res.data);
    } catch (error) {
      toast.error('Failed to setup 2FA');
    }
  };

  const handle2FAVerify = async () => {
    try {
      await authApi.verify2FA(twoFACode);
      setTwoFASetup(null);
      setTwoFACode('');
      if (refreshUser) await refreshUser();
      toast.success('2FA enabled!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid code');
    }
  };

  const handle2FADisable = async () => {
    try {
      await authApi.disable2FA(disable2FACode);
      setShowDisable2FA(false);
      setDisable2FACode('');
      if (refreshUser) await refreshUser();
      toast.success('2FA disabled');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid code');
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) return toast.error('Key name required');
    try {
      const res = await apiKeyApi.create({ name: newKeyName });
      setShowNewKey(res.data.key);
      setNewKeyName('');
      fetchApiKeys();
      toast.success('API key created!');
    } catch (error) {
      toast.error('Failed to create key');
    }
  };

  const handleDeleteApiKey = async (id) => {
    try {
      await apiKeyApi.delete(id);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      toast.success('API key deleted');
    } catch (error) {
      toast.error('Failed to delete key');
    }
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      <div className="space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="text-primary-600" /> Profile Information
          </h2>
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="text-primary-600" size={32} />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 p-1.5 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                <FiUpload size={12} />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full capitalize">{user?.role || 'editor'}</span>
            </div>
          </div>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiLock className="text-primary-600" /> Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" required />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiShield className="text-primary-600" /> Two-Factor Authentication
          </h2>
          {user?.twoFactorEnabled ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Enabled</span>
                <span className="text-sm text-gray-500">Your account is protected with 2FA</span>
              </div>
              {showDisable2FA ? (
                <div className="space-y-3">
                  <input type="text" value={disable2FACode} onChange={(e) => setDisable2FACode(e.target.value)} placeholder="Enter 2FA code to disable" className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                  <div className="flex gap-2">
                    <button onClick={handle2FADisable} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Disable 2FA</button>
                    <button onClick={() => setShowDisable2FA(false)} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowDisable2FA(true)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Disable 2FA</button>
              )}
            </div>
          ) : twoFASetup ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Scan this QR code with your authenticator app:</p>
              <img src={twoFASetup.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 mx-auto" />
              <p className="text-xs text-gray-500">Manual key: <code className="bg-gray-100 px-2 py-1 rounded">{twoFASetup.secret}</code></p>
              <div className="flex gap-2">
                <input type="text" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} placeholder="Enter 6-digit code" className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <button onClick={handle2FAVerify} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Verify & Enable</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account</p>
              <button onClick={handle2FASetup} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Setup 2FA</button>
            </div>
          )}
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiKey className="text-primary-600" /> API Keys
          </h2>
          <p className="text-sm text-gray-500 mb-4">Manage your API keys for programmatic access</p>

          {showNewKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-700 font-medium mb-2">New API key created! Copy it now - it won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">{showNewKey}</code>
                <button onClick={() => { navigator.clipboard.writeText(showNewKey); toast.success('Copied!'); }} className="p-2 text-green-600 hover:bg-green-100 rounded-lg">
                  <FiCopy size={18} />
                </button>
              </div>
              <button onClick={() => setShowNewKey(null)} className="text-sm text-green-600 mt-2 hover:underline">Dismiss</button>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="Key name (e.g. Production)" className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <button onClick={handleCreateApiKey} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1">
              <FiPlus size={16} /> Create
            </button>
          </div>

          {apiKeys.length > 0 ? (
            <div className="space-y-2">
              {apiKeys.map(key => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{key.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{key.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${key.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {key.active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => handleDeleteApiKey(key.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No API keys yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
