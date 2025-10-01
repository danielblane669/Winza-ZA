import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, Briefcase, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    occupation: ''
  });

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  React.useEffect(() => {
    if (isOpen) {
      setError('');
      setFormData({
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        occupation: ''
      });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const sendNewUserEmail = async (userData: any) => {
    try {
      const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mlsn.27898656bc690c603ee224cac9777cfbf7ab2865c24fb555d4daec9f5a2f6f2c'
        },
        body: JSON.stringify({
          from: {
            email: 'info@trial-3z0vklo7jz0lqx2n.mlsender.net',
            name: 'Winza ZA'
          },
          to: [{
            email: 'winzainfo@gmail.com',
            name: 'Winza Admin'
          }],
          subject: 'New User Registration - Winza ZA',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New User Registration</h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">A new user has joined Winza ZA!</p>
              </div>
              
              <div style="background-color: #f0fdf4; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 5px solid #059669;">
                <h2 style="color: #059669; margin-top: 0; font-size: 20px;">👤 User Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 10px 0; font-weight: bold; color: #374151;">Full Name:</td><td style="padding: 10px 0; color: #1f2937;">${userData.fullName}</td></tr>
                  <tr><td style="padding: 10px 0; font-weight: bold; color: #374151;">Email:</td><td style="padding: 10px 0; color: #1f2937;">${userData.email}</td></tr>
                  <tr><td style="padding: 10px 0; font-weight: bold; color: #374151;">Phone:</td><td style="padding: 10px 0; color: #1f2937;">${userData.phoneNumber}</td></tr>
                  <tr><td style="padding: 10px 0; font-weight: bold; color: #374151;">Occupation:</td><td style="padding: 10px 0; color: #1f2937;">${userData.occupation}</td></tr>
                  <tr><td style="padding: 10px 0; font-weight: bold; color: #374151;">Registration Date:</td><td style="padding: 10px 0; color: #1f2937;">${new Date().toLocaleString('en-ZA')}</td></tr>
                  <tr><td style="padding: 10px 0; font-weight: bold; color: #374151;">Starting Balance:</td><td style="padding: 10px 0; color: #059669; font-weight: bold;">R${userData.currentBalance.toFixed(2)}</td></tr>
                </table>
              </div>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>📧 This is an automated notification from Winza ZA.</strong><br>
                  The user can now access their dashboard and participate in winning opportunities.
                </p>
              </div>
            </div>
          `,
          text: `New User Registration - Winza ZA

A new user has registered on Winza ZA:

USER INFORMATION:
Name: ${userData.fullName}
Email: ${userData.email}
Phone: ${userData.phoneNumber}
Occupation: ${userData.occupation}
Registration Date: ${new Date().toLocaleString('en-ZA')}
Starting Balance: R${userData.currentBalance.toFixed(2)}

This is an automated notification from Winza ZA.`
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('MailerSend API Error:', response.status, errorData);
      } else {
        console.log('✅ New user registration email sent successfully to winzainfo@gmail.com');
      }
    } catch (emailError) {
      console.error('❌ Failed to send new user registration email:', emailError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        // Validate signup form
        if (!formData.fullName.trim()) {
          throw new Error('Full name is required');
        }
        if (!formData.phoneNumber.trim()) {
          throw new Error('Phone number is required');
        }
        if (!formData.occupation.trim()) {
          throw new Error('Occupation is required');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        // Create user document in Firestore
        const userData = {
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          occupation: formData.occupation,
          currentBalance: 0.00, // Starting balance
          withdrawalFee: 150.00,
          approvalFee: 250.00,
          whatsappNumber: '+27630316583',
          companyEmail: 'winzainfo@gmail.com',
          isAdmin: false,
          createdAt: new Date().toISOString(),
          paidWithdrawalFee: false,
          paidApprovalFee: false,
          totalWins: 0,
          prizesWon: 0
        };

        await setDoc(doc(db, 'users', user.uid), userData);

        // Send welcome email to admin
        await sendNewUserEmail(userData);

        console.log('✅ User registered successfully:', formData.email);
        onClose();
      } else {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        console.log('✅ User signed in successfully:', formData.email);
        onClose();
      }
    } catch (err: any) {
      console.error('❌ Authentication error:', err);
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Welcome Back' : 'Join Winza ZA'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+27 123 456 789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Occupation *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Your occupation"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {mode === 'signup' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
              </div>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;