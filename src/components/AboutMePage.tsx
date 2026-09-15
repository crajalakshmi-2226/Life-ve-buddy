import React, { useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Heart, 
  Camera, 
  Trash2, 
  Plus, 
  Check, 
  Palette, 
  ShieldCheck, 
  Sparkles, 
  X,
  Upload,
  Eye,
  AlertCircle
} from 'lucide-react';
import { UserProfile, UserProfileField, AppTheme } from '../types';
import { playSuccessChime } from '../utils/audio';

interface AboutMePageProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClose?: () => void;
  soundEnabled: boolean;
  onToast: (title: string, body: string, type?: 'info' | 'success' | 'alert') => void;
  onThemeChange?: (theme: AppTheme) => void;
}

const THEME_OPTIONS: { id: AppTheme; label: string; previewClass: string; accentClass: string; description: string }[] = [
  {
    id: 'purple',
    label: 'Royal Purple',
    previewClass: 'bg-purple-600',
    accentClass: 'border-purple-500 text-purple-700 bg-purple-50',
    description: 'Classic LifeBuddy aesthetic with royal purple accents'
  },
  {
    id: 'blue',
    label: 'Sapphire Blue',
    previewClass: 'bg-blue-600',
    accentClass: 'border-blue-500 text-blue-700 bg-blue-50',
    description: 'Oceanic deep blue for high focus & calm clarity'
  },
  {
    id: 'green',
    label: 'Emerald Mint',
    previewClass: 'bg-emerald-600',
    accentClass: 'border-emerald-500 text-emerald-700 bg-emerald-50',
    description: 'Fresh botanical mint green for daily productivity'
  },
  {
    id: 'pink',
    label: 'Rose Blossom',
    previewClass: 'bg-pink-500',
    accentClass: 'border-pink-500 text-pink-700 bg-pink-50',
    description: 'Vibrant cherry blossom pink with warm tones'
  },
  {
    id: 'amber',
    label: 'Sunset Amber',
    previewClass: 'bg-amber-500',
    accentClass: 'border-amber-500 text-amber-800 bg-amber-50',
    description: 'Warm golden amber for study warmth & comfort'
  },
  {
    id: 'dark',
    label: 'Midnight Dark',
    previewClass: 'bg-slate-900 border border-slate-700',
    accentClass: 'border-slate-500 text-slate-200 bg-slate-800',
    description: 'Cyber dark mode with eye-comfort contrast'
  }
];

export const AboutMePage: React.FC<AboutMePageProps> = ({
  profile,
  onUpdateProfile,
  onClose,
  soundEnabled,
  onToast,
  onThemeChange
}) => {
  const [name, setName] = useState(profile.name || '');
  const [hobby, setHobby] = useState(profile.hobby || '');
  const [college, setCollege] = useState(profile.college || '');
  const [email, setEmail] = useState(profile.email || '');
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(profile.profilePhoto);
  const [customFields, setCustomFields] = useState<UserProfileField[]>(profile.customFields || []);
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>(profile.theme || 'purple');

  // Track which default fields the user chose to keep (user can delete ANY field)
  const [showNameField, setShowNameField] = useState(true);
  const [showHobbyField, setShowHobbyField] = useState(true);
  const [showCollegeField, setShowCollegeField] = useState(true);
  const [showEmailField, setShowEmailField] = useState(true);

  // New custom field form
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [isAddingField, setIsAddingField] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      onToast('Photo Too Large', 'Please select an image smaller than 2.5MB.', 'alert');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setProfilePhoto(result);
      if (soundEnabled) playSuccessChime();
      onToast('Photo Updated', 'Profile photo saved privately on this device.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(undefined);
    onToast('Photo Removed', 'Profile photo cleared.', 'info');
  };

  // Add custom field
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const newField: UserProfileField = {
      id: `field_${Date.now()}`,
      label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
      isCustom: true
    };

    setCustomFields(prev => [...prev, newField]);
    setNewFieldLabel('');
    setNewFieldValue('');
    setIsAddingField(false);
    onToast('Field Added', `Added "${newField.label}" to your profile.`, 'success');
  };

  // Delete custom field
  const handleDeleteCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
    onToast('Field Removed', 'Profile field deleted.', 'info');
  };

  // Update custom field value
  const handleUpdateCustomFieldValue = (id: string, value: string) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, value } : f));
  };

  // Save profile and trigger owner notification if first time signup
  const handleSaveProfile = async () => {
    const updatedProfile: UserProfile = {
      name: showNameField ? name : '',
      hobby: showHobbyField ? hobby : '',
      college: showCollegeField ? college : '',
      email: showEmailField ? email : '',
      profilePhoto,
      customFields,
      theme: selectedTheme,
      firstSignupSent: profile.firstSignupSent || false
    };

    // Check if new user signup notification is needed
    // Condition: User filled name + email, and firstSignupSent hasn't been triggered yet
    if (!profile.firstSignupSent && name.trim() && email.trim()) {
      try {
        // Send email notification to app owner at c.rajalakshmi12259@gmail.com
        const ownerEmail = 'c.rajalakshmi12259@gmail.com';
        const payload = {
          recipient: ownerEmail,
          subject: `✨ New LifeBuddy User Signup: ${name.trim()}`,
          body: `Hello Admin,\n\nA new user has set up their LifeBuddy profile:\n\n• Name: ${name.trim()}\n• Email: ${email.trim()}\n• College/Institution: ${college.trim() || 'Not specified'}\n• Hobbies: ${hobby.trim() || 'Not specified'}\n• Registered At: ${new Date().toLocaleString()}\n\nWelcome them to LifeBuddy!`,
          userName: name.trim(),
          userEmail: email.trim(),
          college: college.trim()
        };

        // Fire request to server or dispatch endpoint (safe non-blocking)
        fetch('/api/notify-owner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => {
          console.debug('Background signup notification sent:', err);
        });

        // Also log in localStorage so we don't repeat notifications
        localStorage.setItem('owner_notified_signup', JSON.stringify({ email: email.trim(), date: Date.now() }));
        updatedProfile.firstSignupSent = true;
      } catch (notifErr) {
        console.warn('Signup notification handler error:', notifErr);
        updatedProfile.firstSignupSent = true;
      }
    }

    onUpdateProfile(updatedProfile);
    if (soundEnabled) playSuccessChime();
    onToast('Profile Saved', 'Your profile and theme settings have been updated!', 'success');
    if (onClose) onClose();
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-purple-200/90 shadow-sm space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-purple-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl shadow-xs border border-purple-200">
            👤
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-classic text-purple-950">
              About Me & App Theme
            </h1>
            <p className="text-xs text-purple-700/80 font-medium">
              Manage your personal student profile, private photo, and customize app-wide color theme
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-purple-400 hover:text-purple-700 hover:bg-purple-100 transition-colors"
            title="Close About Me"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 1. PROFILE PHOTO SECTION (Private, local only) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/70 border border-purple-200/70 flex flex-col sm:flex-row items-center gap-5">
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white border-2 border-purple-300 shadow-md flex items-center justify-center">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-purple-300">
                <User className="w-12 h-12" />
                <span className="text-[10px] font-bold text-purple-400">No Photo</span>
              </div>
            )}
          </div>

          {/* Camera upload overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Profile Photo"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-700 text-white shadow-md hover:bg-purple-800 transition-transform active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-sm sm:text-base font-bold text-purple-950">
              Profile Photo
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3" /> Private to you
            </span>
          </div>
          <p className="text-xs text-purple-700/80 leading-relaxed max-w-md">
            Your photo is stored locally on this browser session only. It is never uploaded to public servers or shared with anyone else.
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
            </button>
            {profilePhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. APP THEME CUSTOMIZATION (Request 2) */}
      <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-white border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm sm:text-base font-bold text-purple-950 font-classic">
              App Theme Customization
            </h3>
          </div>
          <span className="text-[11px] text-purple-600 font-medium">
            Applied instantly across all pages
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {THEME_OPTIONS.map((themeOption) => {
            const isSelected = selectedTheme === themeOption.id;
            return (
              <button
                key={themeOption.id}
                type="button"
                onClick={() => {
                  setSelectedTheme(themeOption.id);
                  // Apply theme immediately to document/html
                  document.documentElement.setAttribute('data-theme', themeOption.id);
                  if (themeOption.id === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  if (onThemeChange) onThemeChange(themeOption.id);
                  if (soundEnabled) playSuccessChime();
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'ring-2 ring-purple-600 border-purple-500 bg-purple-50/80 shadow-xs'
                    : 'border-purple-100 hover:border-purple-200 bg-slate-50/50 hover:bg-purple-50/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full shadow-xs ${themeOption.previewClass}`} />
                    <span className="text-xs font-bold text-purple-950">
                      {themeOption.label}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-700 font-bold" />}
                </div>
                <p className="text-[11px] text-purple-600/80 line-clamp-2 leading-tight">
                  {themeOption.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PROFILE FIELDS (Mandatory + Custom with Delete) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-purple-950 font-classic">
              Profile Information
            </h3>
            <p className="text-xs text-purple-600">
              Edit any field, add custom details, or delete fields you do not wish to show
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingField(!isAddingField)}
            className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Field</span>
          </button>
        </div>

        {/* Add Custom Field Form */}
        {isAddingField && (
          <form
            onSubmit={handleAddCustomField}
            className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-3 animate-fadeIn"
          >
            <div className="text-xs font-bold text-purple-900">
              Add New Custom Profile Field
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                  Field Name (e.g. Department, Semester, Roll No, GitHub)
                </label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. Department"
                  required
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                  Value / Detail
                </label>
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="e.g. Computer Science & Eng"
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingField(false)}
                className="px-3 py-1.5 text-xs text-purple-700 font-semibold hover:bg-purple-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-700 text-white text-xs font-bold rounded-xl hover:bg-purple-800 transition-colors shadow-2xs"
              >
                Add Field
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {/* Field 1: Name */}
          {showNameField && (
            <div className="p-3.5 rounded-2xl bg-white border border-purple-200 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <label className="text-xs font-bold text-purple-900">
                    Name <span className="text-rose-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-3 py-1.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNameField(false)}
                title="Delete this field"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer self-end mb-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Field 2: Hobby / Interest */}
          {showHobbyField && (
            <div className="p-3.5 rounded-2xl bg-white border border-purple-200 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Heart className="w-3.5 h-3.5 text-pink-600" />
                  <label className="text-xs font-bold text-purple-900">
                    Hobby / Interest <span className="text-rose-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={hobby}
                  onChange={(e) => setHobby(e.target.value)}
                  placeholder="e.g. Competitive Programming, Badminton, Photography"
                  className="w-full px-3 py-1.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowHobbyField(false)}
                title="Delete this field"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer self-end mb-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Field 3: College / Institution Name */}
          {showCollegeField && (
            <div className="p-3.5 rounded-2xl bg-white border border-purple-200 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <label className="text-xs font-bold text-purple-900">
                    College / Institution Name <span className="text-rose-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. Institute of Science & Technology"
                  className="w-full px-3 py-1.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCollegeField(false)}
                title="Delete this field"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer self-end mb-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Field 4: Email ID */}
          {showEmailField && (
            <div className="p-3.5 rounded-2xl bg-white border border-purple-200 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <label className="text-xs font-bold text-purple-900">
                    Email ID <span className="text-rose-500">*</span>
                  </label>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. student@college.edu"
                  className="w-full px-3 py-1.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowEmailField(false)}
                title="Delete this field"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer self-end mb-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Custom Fields Added by User */}
          {customFields.map((field) => (
            <div
              key={field.id}
              className="p-3.5 rounded-2xl bg-white border border-purple-200 flex items-center justify-between gap-3 animate-fadeIn"
            >
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <label className="text-xs font-bold text-purple-900">
                    {field.label}
                  </label>
                </div>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleUpdateCustomFieldValue(field.id, e.target.value)}
                  placeholder={`Enter ${field.label}`}
                  className="w-full px-3 py-1.5 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-purple-950 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDeleteCustomField(field.id)}
                title={`Delete ${field.label}`}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer self-end mb-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex items-center justify-end gap-3 border-t border-purple-100">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSaveProfile}
          className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Save Profile & Apply Theme</span>
        </button>
      </div>
    </div>
  );
};
