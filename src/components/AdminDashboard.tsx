import React, { useState, useEffect } from 'react';
import { Search, Users, Wallet, Plus, Minus, AlertCircle, Trophy, Gift, Settings, Phone, Mail } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc, increment, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AdminDashboardProps {
  user: any;
}

interface UserData {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  occupation: string;
  currentBalance: number;
  withdrawalFee: number;
  approvalFee: number;
  whatsappNumber?: string;
  companyEmail?: string;
  isAdmin: boolean;
  createdAt: string;
  paidWithdrawalFee?: boolean;
  paidApprovalFee?: boolean;
  totalWins?: number;
  prizesWon?: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [description, setDescription] = useState('');
  const [totalWins, setTotalWins] = useState('');
  const [prizesWon, setPrizesWon] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
  }, []);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', searchEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found');
        setSelectedUser(null);
      } else {
        const userData = querySnapshot.docs[0].data() as UserData;
        setSelectedUser({
          ...userData,
          id: querySnapshot.docs[0].id
        });
      }
    } catch (err) {
      setError('Error searching for user');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceUpdate = async (type: 'add' | 'reduce') => {
    if (!selectedUser) return;
    
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      const finalAmount = type === 'add' ? amount : -amount;

      // Update user balance
      await updateDoc(userDocRef, {
        currentBalance: increment(finalAmount)
      });

      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: selectedUser.id,
        type: type === 'add' ? 'credit' : 'debit',
        amount: amount,
        description: description,
        timestamp: new Date().toISOString(),
        adminId: user.uid,
        adminEmail: user.email
      });

      // Refresh user data
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        setSelectedUser({
          ...selectedUser,
          currentBalance: updatedUserDoc.data().currentBalance
        });
      }

      setSuccess(`Successfully ${type === 'add' ? 'added' : 'reduced'} R${amount.toFixed(2)} ${type === 'add' ? 'to' : 'from'} ${selectedUser.email}`);
      setBalanceAmount('');
      setDescription('');
    } catch (err) {
      setError(`Error ${type === 'add' ? 'adding' : 'reducing'} balance`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatsUpdate = async () => {
    if (!selectedUser) return;
    
    const wins = parseInt(totalWins);
    const prizes = parseFloat(prizesWon);
    
    if (isNaN(wins) || isNaN(prizes) || wins < 0 || prizes < 0) {
      setError('Please enter valid numbers for wins and prizes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      
      await updateDoc(userDocRef, {
        totalWins: wins,
        prizesWon: prizes
      });

      // Refresh user data
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        setSelectedUser({
          ...selectedUser,
          totalWins: wins,
          prizesWon: prizes
        });
      }

      setSuccess(`Successfully updated stats for ${selectedUser.email}`);
      setTotalWins('');
      setPrizesWon('');
    } catch (err) {
      setError('Error updating user stats');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusUpdate = async (field: 'paidWithdrawalFee' | 'paidApprovalFee', value: boolean) => {
    if (!selectedUser) return;

    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userDocRef, {
        [field]: value
      });

      // If approving approval fee, update withdrawal transactions
      if (field === 'paidApprovalFee' && value) {
        // Find pending withdrawal transactions for this user
        const transactionsRef = collection(db, 'transactions');
        const q = query(transactionsRef, where('userId', '==', selectedUser.id));
        const querySnapshot = await getDocs(q);
        
        for (const transactionDoc of querySnapshot.docs) {
          const transaction = transactionDoc.data();
          if (transaction.status === 'pending' && transaction.type === 'debit') {
            // Update transaction status to approved
            await updateDoc(doc(db, 'transactions', transactionDoc.id), {
              status: 'approved',
              description: transaction.description.replace('(Pending)', '(Approved)')
            });
            
            // Deduct the withdrawal amount from user balance
            await updateDoc(userDocRef, {
              currentBalance: increment(-transaction.amount)
            });
          }
        }
      }

      // Refresh user data
      const updatedUserDoc = await getDoc(userDocRef);
      if (updatedUserDoc.exists()) {
        setSelectedUser({
          ...selectedUser,
          [field]: value,
          ...(field === 'paidApprovalFee' && value ? { currentBalance: updatedUserDoc.data().currentBalance } : {})
        });
      }

      setSuccess(`Successfully updated ${field === 'paidWithdrawalFee' ? 'withdrawal fee' : 'approval fee'} status for ${selectedUser.email}`);
    } catch (err) {
      setError(`Error updating payment status`);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError('');

    try {
      const userDocRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userDocRef, {
        withdrawalFee: selectedUser.withdrawalFee,
        approvalFee: selectedUser.approvalFee,
        whatsappNumber: selectedUser.whatsappNumber,
        companyEmail: selectedUser.companyEmail
      });
      
      setSuccess(`Settings updated successfully for ${selectedUser.email}`);
    } catch (err) {
      setError('Error updating settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage user accounts and balances</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(success || error) && (
          <div className={`mb-6 p-4 rounded-lg ${
            success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <AlertCircle className={`w-5 h-5 ${success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              <p className={`${success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                {success || error}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* User Search */}
          <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-colors duration-200">
            <div className="flex items-center space-x-3 mb-6">
              <Search className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Find User</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Email Address
                </label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {selectedUser && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">User Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Occupation:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.occupation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Balance:</span>
                      <span className="font-bold text-emerald-600">
                        R{selectedUser.currentBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Admin Status:</span>
                      <span className={`font-medium ${selectedUser.isAdmin ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'}`}>
                        {selectedUser.isAdmin ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Wins:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{selectedUser.totalWins || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Prizes Won:</span>
                      <span className="font-medium text-gray-900 dark:text-white">R{(selectedUser.prizesWon || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Paid Withdrawal Fee:</span>
                      <span className={`font-medium ${selectedUser.paidWithdrawalFee ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.paidWithdrawalFee ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Paid Approval Fee:</span>
                      <span className={`font-medium ${selectedUser.paidApprovalFee ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedUser.paidApprovalFee ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* App Settings */}
          <div className="xl:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-colors duration-200">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Settings</h2>
            </div>

            {selectedUser ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Withdrawal Fee (R)
                </label>
                <input
                  type="number"
                  value={selectedUser.withdrawalFee}
                  onChange={(e) => setSelectedUser({...selectedUser, withdrawalFee: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Approval Fee (R)
                </label>
                <input
                  type="number"
                  value={selectedUser.approvalFee}
                  onChange={(e) => setSelectedUser({...selectedUser, approvalFee: parseFloat(e.target.value) || 0})}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={selectedUser.whatsappNumber || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, whatsappNumber: e.target.value})}
                  placeholder="+27123456789"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={selectedUser.companyEmail || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, companyEmail: e.target.value})}
                  placeholder="support@company.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleSettingsUpdate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50"
              >
                Update User Settings
              </button>
            </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">Select a user to manage their individual settings</p>
              </div>
            )}
          </div>
        </div>
        
        {selectedUser && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Balance Management */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-6">
                <Wallet className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Balance</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (R)
                  </label>
                  <input
                    type="number"
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Reason for balance change..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleBalanceUpdate('add')}
                    disabled={loading || !balanceAmount || !description}
                    className="flex items-center justify-center space-x-2 bg-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Balance</span>
                  </button>

                  <button
                    onClick={() => handleBalanceUpdate('reduce')}
                    disabled={loading || !balanceAmount || !description}
                    className="flex items-center justify-center space-x-2 bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                    <span>Reduce Balance</span>
                  </button>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                      <strong>Current Balance:</strong> R{selectedUser.currentBalance.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Status Management */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-6">
                <AlertCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Status</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Withdrawal Fee Payment Status
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="withdrawalFee"
                        checked={selectedUser.paidWithdrawalFee === true}
                        onChange={() => handlePaymentStatusUpdate('paidWithdrawalFee', true)}
                        className="mr-2"
                      />
                      <span className="text-green-600 font-medium">Paid</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="withdrawalFee"
                        checked={selectedUser.paidWithdrawalFee !== true}
                        onChange={() => handlePaymentStatusUpdate('paidWithdrawalFee', false)}
                        className="mr-2"
                      />
                      <span className="text-red-600 font-medium">Not Paid</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Approval Fee Payment Status
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="approvalFee"
                        checked={selectedUser.paidApprovalFee === true}
                        onChange={() => handlePaymentStatusUpdate('paidApprovalFee', true)}
                        className="mr-2"
                      />
                      <span className="text-green-600 font-medium">Paid</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="approvalFee"
                        checked={selectedUser.paidApprovalFee !== true}
                        onChange={() => handlePaymentStatusUpdate('paidApprovalFee', false)}
                        className="mr-2"
                      />
                      <span className="text-red-600 font-medium">Not Paid</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    <strong>Note:</strong> When you mark approval fee as paid, all pending withdrawals will be automatically approved. The balance will remain unchanged - you can manually adjust it using the balance management section above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* User Stats Management */}
        {selectedUser && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-6">
                <Trophy className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage User Stats</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Wins
                  </label>
                  <input
                    type="number"
                    value={totalWins}
                    onChange={(e) => setTotalWins(e.target.value)}
                    placeholder={selectedUser.totalWins?.toString() || '0'}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prizes Won (R)
                  </label>
                  <input
                    type="number"
                    value={prizesWon}
                    onChange={(e) => setPrizesWon(e.target.value)}
                    placeholder={selectedUser.prizesWon?.toFixed(2) || '0.00'}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleStatsUpdate}
                  disabled={loading || (!totalWins && !prizesWon)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50"
                >
                  Update User Stats
                </button>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    <strong>Current Stats:</strong> {selectedUser.totalWins || 0} wins, R{(selectedUser.prizesWon || 0).toFixed(2)} in prizes
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!selectedUser && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 transition-colors duration-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No User Selected</h3>
                <p className="text-gray-600 dark:text-gray-300">Search for a user above to manage their account, balance, and individual settings.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;