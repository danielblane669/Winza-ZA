import React, { useState, useEffect } from 'react';
import { User, Wallet, History, Trophy, Gift, X } from 'lucide-react';
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserDashboardProps {
  user: any;
  userData: any;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
  status?: string;
}

interface AppSettings {
  withdrawalFee: number;
  approvalFee: number;
  whatsappNumber: string;
  companyEmail: string;
}

interface WithdrawalRequest {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  amount: number;
  requestedAt: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, userData }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showWithdrawalFeeModal, setShowWithdrawalFeeModal] = useState(false);
  const [showApprovalFeeModal, setShowApprovalFeeModal] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountType: 'savings',
    accountHolder: '',
    branchCode: ''
  });
  const [withdrawalSubmitted, setWithdrawalSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;


    // Real-time listener for transactions
    const transactionsRef = collection(db, 'transactions');
    const transactionsQuery = query(transactionsRef, where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
      
      setTransactions(transactionData);
      setLoading(false);
    });

    // Real-time listener for pending withdrawals
    const withdrawalsRef = collection(db, 'withdrawals');
    const withdrawalsQuery = query(withdrawalsRef, where('userId', '==', user.uid), where('status', '==', 'pending'));
    
    const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
      const withdrawalData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawalRequest[];
      
      setPendingWithdrawals(withdrawalData);
    });
    return () => {
      unsubscribe();
      unsubscribeWithdrawals();
    };
  }, [user]);

  const handleWithdrawClick = () => {
    // Check if user has pending withdrawals
    if (pendingWithdrawals.length > 0) {
      alert('You have a pending withdrawal request. Please wait for it to be processed before submitting a new request.');
      return;
    }
    
    if (!userData?.paidWithdrawalFee) {
      setShowWithdrawalFeeModal(true);
    } else {
      setShowWithdrawalForm(true);
    }
  };

  const handleWithdrawalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setWithdrawalData({
      ...withdrawalData,
      [e.target.name]: e.target.value
    });
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const withdrawalAmount = parseFloat(withdrawalData.amount);
      
      // Add withdrawal request to database
      const withdrawalRef = await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        userEmail: user.email,
        amount: withdrawalAmount,
        bankName: withdrawalData.bankName,
        accountNumber: withdrawalData.accountNumber,
        accountType: withdrawalData.accountType,
        accountHolder: withdrawalData.accountHolder,
        branchCode: withdrawalData.branchCode,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });
      
      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'debit',
        amount: withdrawalAmount,
        description: 'Withdrawal Request (Pending)',
        timestamp: new Date().toISOString(),
        status: 'pending',
        withdrawalId: withdrawalRef.id
      });
      
      setWithdrawalSubmitted(true);
      setShowWithdrawalForm(false);
      setShowApprovalFeeModal(true);
      setWithdrawalData({
        amount: '',
        bankName: '',
        accountNumber: '',
        accountType: 'savings',
        accountHolder: '',
        branchCode: ''
      });
      
      setTimeout(() => setWithdrawalSubmitted(false), 10000);
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
    }
  };

  const openWhatsApp = () => {
    if (userData?.whatsappNumber) {
      const cleanNumber = userData.whatsappNumber.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {userData?.fullName || user.email}!</h1>
              <p className="text-gray-600 dark:text-gray-300">Ready to win big today?</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Balance and Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Wallet className="w-8 h-8" />
                <h2 className="text-xl font-bold">Current Balance</h2>
              </div>
              <div className="text-4xl font-bold mb-2">
                R{userData?.currentBalance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-emerald-100">Available for withdrawal</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Total Wins</h3>
                    <p className="text-2xl font-bold text-yellow-600">{userData?.totalWins || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Gift className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Prizes Won</h3>
                    <p className="text-2xl font-bold text-purple-600">R{userData?.prizesWon?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 transition-colors duration-200">
              <div className="flex items-center space-x-3 mb-6">
                <History className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No transactions yet</h3>
                  <p className="text-gray-600 dark:text-gray-300">Your transaction history will appear here once you start playing.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{transaction.description}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(transaction.timestamp).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}R{transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              {withdrawalSubmitted && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-400">Withdrawal Request Submitted</h4>
                      <p className="text-green-700 dark:text-green-300 text-sm">Your withdrawal will be processed within 24 hours.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={handleWithdrawClick}
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Withdraw Funds
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Withdrawal Fee Modal */}
        {showWithdrawalFeeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full transition-colors duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Withdrawal Fee Required</h2>
                <button
                  onClick={() => setShowWithdrawalFeeModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment Required</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    To withdraw your current balance, you need to pay a withdrawal fee of:
                  </p>
                  <div className="text-3xl font-bold text-yellow-600 mb-6">
                    R{userData?.withdrawalFee?.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">Contact Our Agent</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                    Contact our agent on WhatsApp for guidance on how to pay your withdrawal fee:
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={openWhatsApp}
                      className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      WhatsApp: {userData?.whatsappNumber || 'Loading...'}
                    </button>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Email: {userData?.companyEmail || 'Loading...'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowWithdrawalFeeModal(false)}
                  className="w-full bg-gray-600 dark:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Approval Fee Modal */}
        {showApprovalFeeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full transition-colors duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Approval Fee Required</h2>
                <button
                  onClick={() => setShowApprovalFeeModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Withdrawal Pending</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Your withdrawal is currently pending and requires an approval fee of:
                  </p>
                  <div className="text-3xl font-bold text-orange-600 mb-6">
                    R{userData?.approvalFee?.toFixed(2) || '0.00'}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">Contact Our Agent</h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                    Contact our agent on WhatsApp for guidance on how to pay your approval fee:
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={openWhatsApp}
                      className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      WhatsApp: {userData?.whatsappNumber || 'Loading...'}
                    </button>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Email: {userData?.companyEmail || 'Loading...'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowApprovalFeeModal(false)}
                  className="w-full bg-gray-600 dark:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Withdrawal Form Modal */}
        {showWithdrawalForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Withdraw Funds</h2>
                <button
                  onClick={() => setShowWithdrawalForm(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleWithdrawalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Withdrawal Amount (R)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={withdrawalData.amount}
                    onChange={handleWithdrawalChange}
                    required
                    min="10"
                    max={userData?.currentBalance || 0}
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Available: R{userData?.currentBalance?.toFixed(2) || '0.00'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    value={withdrawalData.accountHolder}
                    onChange={handleWithdrawalChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Full name as on bank account"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={withdrawalData.bankName}
                    onChange={handleWithdrawalChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Standard Bank, FNB, ABSA"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={withdrawalData.accountNumber}
                    onChange={handleWithdrawalChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Account number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Type
                  </label>
                  <select
                    name="accountType"
                    value={withdrawalData.accountType}
                    onChange={handleWithdrawalChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                    <option value="transmission">Transmission</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    name="branchCode"
                    value={withdrawalData.branchCode}
                    onChange={handleWithdrawalChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="6-digit branch code"
                  />
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                    <strong>Processing Time:</strong> Withdrawals are processed within 24 hours during business days.
                  </p>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-800 transition-all duration-300"
                >
                  Submit Withdrawal Request
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;