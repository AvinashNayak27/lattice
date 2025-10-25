import { motion } from 'framer-motion'
import { Users, TrendingUp, ExternalLink, Copy, Check, Trophy, ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight, Edit3, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import sdk from "@farcaster/miniapp-sdk";

// Skeleton Components
const SkeletonBox = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-black/10 rounded ${className}`} />
)

const ProfileHeaderSkeleton = () => (
  <div className="card">
    <div className="flex flex-row gap-4 md:gap-6">
      <SkeletonBox className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl" />
      <div className="flex-1">
        <div className="flex flex-row items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <SkeletonBox className="h-6 w-32 mb-2" />
            <SkeletonBox className="h-4 w-24 mb-2" />
          </div>
          <div className="flex gap-2">
            <SkeletonBox className="h-8 w-20 rounded-xl" />
          </div>
        </div>
        
        {/* FID Display skeleton */}
        <div className="flex gap-4 sm:gap-6 mt-4 pt-4 border-t border-black/10">
          <div>
            <SkeletonBox className="h-6 w-8 mb-1" />
            <SkeletonBox className="h-3 w-8" />
          </div>
        </div>
      </div>
    </div>
  </div>
)


const TradeItemSkeleton = () => (
  <div className="p-3 sm:p-4 bg-black/5 rounded-2xl">
    <div className="flex flex-row items-center gap-3 sm:gap-4">
      <SkeletonBox className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
          <SkeletonBox className="h-4 w-20" />
          <SkeletonBox className="h-5 w-12 rounded-full" />
          <SkeletonBox className="h-5 w-8 rounded-full" />
        </div>
        <SkeletonBox className="h-3 w-16" />
      </div>
      <div className="text-right">
        <SkeletonBox className="h-5 w-16 mb-1" />
        <SkeletonBox className="h-3 w-12" />
      </div>
    </div>
  </div>
)

const TradingActivitySkeleton = () => (
  <div className="card">
    <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-black/10">
      <SkeletonBox className="h-8 w-16" />
      <SkeletonBox className="h-8 w-20" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <TradeItemSkeleton key={i} />
      ))}
    </div>
  </div>
)

interface TopTrade {
  _id: string
  event: {
    args: {
      t: {
        index: number
        initialPosToken: number
        leverage: number
        openPrice: number
        pairIndex: number
        positionSizeUSDC: number
        sl: number
        tp: number
        trader: string
        buy: boolean
        timestamp: number
      }
      price: number
      positionSizeUSDC: number
      usdcSentToTrader: number
      _feeInfo: {
        closingFee: number
        r: number
        lossProtectionPSum: number
        lossProtection: number
      }
    }
  }
  _mapped_netPnl: number
  _grossPnl: number
  timeStamp: string
  pairInfo?: {
    from: string
    to: string
  }
  to?: string
}

interface TradeDetailsModalProps {
  trade: TopTrade
  onClose: () => void
}

interface PortfolioStats {
  totalPnl: number
  totalCollateral: number
  totalTrades: number
  winRate: number
}

const TradeDetailsModal = ({ trade, onClose }: TradeDetailsModalProps) => {
  const netPnl = trade.event.args.usdcSentToTrader - trade.event.args.positionSizeUSDC;
  const isProfit = netPnl > 0;
  const pnlPercentage = ((netPnl / trade.event.args.positionSizeUSDC) * 100).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold">Trade Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* PnL Summary at Top */}
        <div className={`p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-center">
            <p className={`text-xl sm:text-2xl font-bold mb-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {isProfit ? '+' : ''}{netPnl.toFixed(2)} USDC ({pnlPercentage}%)
            </p>
            <p className="text-xs sm:text-sm text-black/50">Net Profit/Loss</p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Entry Details */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Entry</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>Entry Price: <span className="font-mono font-medium">${trade.event.args.t.openPrice}</span></div>
              <div>Position Size: <span className="font-mono font-medium">${trade.event.args.t.positionSizeUSDC}</span></div>
              <div>Leverage: <span className="font-mono font-medium">{trade.event.args.t.leverage}x</span></div>
              <div>Direction: <span className={`font-medium ${trade.event.args.t.buy ? 'text-green-600' : 'text-red-600'}`}>
                {trade.event.args.t.buy ? 'Long' : 'Short'}
              </span></div>
            </div>
          </div>

          {/* Exit Details */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Exit</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>Exit Price: <span className="font-mono font-medium">${trade.event.args.price}</span></div>
              <div>USDC Received: <span className="font-mono font-medium">${trade.event.args.usdcSentToTrader}</span></div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Fees & Protection</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="text-red-600">Closing Fee: <span className="font-mono">-${trade.event.args._feeInfo.closingFee}</span></div>
              <div className="text-orange-600">Referral Fee: <span className="font-mono">-${trade.event.args._feeInfo.r}</span></div>
              <div className="text-green-600">Loss Protection: <span className="font-mono">+${trade.event.args._feeInfo.lossProtection}</span></div>
              <div>Protection Sum: <span className="font-mono">${trade.event.args._feeInfo.lossProtectionPSum}</span></div>
            </div>
          </div>

          {/* PnL Summary */}
          <div className="p-3 sm:p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Profit/Loss Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>Gross PnL: <span className={`font-mono ${trade._grossPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${trade._grossPnl.toFixed(2)}
              </span></div>
              <div>Net PnL: <span className={`font-mono ${netPnl > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${netPnl.toFixed(2)} ({pnlPercentage}%)
              </span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://avantis-backend.vercel.app'

// USDC Contract Constants
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
const SPENDER_ADDRESS = '0x8a311D7048c35985aa31C131B9A13e03a5f7422d' // Avantis Spender
const USDC_ABI = [
  {
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  currentAllowance: bigint
  userBalance: bigint
  userAddress: string
  onRefetchAllowance: () => void
}

const ApprovalModal = ({ isOpen, onClose, currentAllowance, userBalance, userAddress, onRefetchAllowance }: ApprovalModalProps) => {
  const [approvalAmount, setApprovalAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Refetch allowance when transaction is successful
  useEffect(() => {
    if (isSuccess) {
      onRefetchAllowance()
    }
  }, [isSuccess, onRefetchAllowance])

  const formatUSDC = (amount: bigint) => {
    return parseFloat(formatUnits(amount, 6)).toFixed(2)
  }

  const handleApprove = async () => {
    if (!approvalAmount || isApproving) return
    
    try {
      setIsApproving(true)
      const amount = parseUnits(approvalAmount, 6)
      await writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [SPENDER_ADDRESS as `0x${string}`, amount],
      })
    } catch (error) {
      console.error('Approval failed:', error)
    } finally {
      setIsApproving(false)
    }
  }

  const handleMaxApprove = async () => {
    if (isApproving) return
    
    try {
      setIsApproving(true)
      const maxAmount = parseUnits('1000000', 6) // 1M USDC max approval
      await writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [SPENDER_ADDRESS as `0x${string}`, maxAmount],
      })
    } catch (error) {
      console.error('Max approval failed:', error)
    } finally {
      setIsApproving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            USDC Approval
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold mb-2 text-sm">Current Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Your USDC Balance:</span>
                <span className="font-mono">{formatUSDC(userBalance)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Current Allowance:</span>
                <span className="font-mono">{formatUSDC(currentAllowance)} USDC</span>
              </div>
            </div>
          </div>

          {/* Approval Amount Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">Approval Amount (USDC)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={approvalAmount}
                onChange={(e) => setApprovalAmount(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={isApproving || isPending || isConfirming}
              />
              <button
                onClick={() => setApprovalAmount(formatUSDC(userBalance))}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"
                disabled={isApproving || isPending || isConfirming}
              >
                Max
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={!approvalAmount || isApproving || isPending || isConfirming}
              className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-semibold hover:bg-black/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving || isPending || isConfirming ? 'Processing...' : 'Approve Amount'}
            </button>
            <button
              onClick={handleMaxApprove}
              disabled={isApproving || isPending || isConfirming}
              className="px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Max Approve
            </button>
          </div>

          {/* Transaction Status */}
          {hash && (
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600">
                Transaction submitted: {hash.slice(0, 10)}...
              </p>
              {isConfirming && (
                <p className="text-xs text-blue-500 mt-1">Waiting for confirmation...</p>
              )}
              {isSuccess && (
                <p className="text-xs text-green-600 mt-1">Transaction confirmed!</p>
              )}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500">
            <p>• Approval allows Avantis to use your USDC for trading</p>
            <p>• You can revoke approval anytime by setting amount to 0</p>
            <p>• Max approve sets a high limit for convenience</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Profile() {
  const { address } = useAccount()
  const [isMiniApp,setIsMiniApp] = useState(false)
  const [userData,setUserData ] = useState<{fid: number; username?: string; displayName?: string; pfpUrl?: string} | null>(null)
  const [topTrades, setTopTrades] = useState<TopTrade[]>([])
  const [portfolioHistory, setPortfolioHistory] = useState<TopTrade[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeTab, setActiveTab] = useState<'activity' | 'top'>('activity')
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [tradesLoading, setTradesLoading] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<TopTrade | null>(null)
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  // USDC Contract Hooks
  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address ? [address, SPENDER_ADDRESS as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  useEffect(() => {
    const init = async () => {
      await sdk.actions.ready({
        disableNativeGestures: true,
      });
      const isInMiniApp = await sdk.isInMiniApp();
      const ctx = await sdk.context;
      const user = ctx.user
      setUserData(user)
      setIsMiniApp(isInMiniApp);
    };
    init();
  }, []);

  // Fetch trades when address is available
  useEffect(() => {
    if (address) {
      fetchTopTrades(address)
      fetchPortfolioHistory(address, 1)
      fetchPortfolioStats(address)
    }
  }, [address])

  const fetchTopTrades = async (userAddress: string) => {
    setTradesLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio/top-trades/${userAddress}`)
      if (!response.ok) throw new Error('Failed to fetch top trades')
      
      const data = await response.json()
      const trades = data || []
      setTopTrades(trades)
    } catch (error) {
      console.error('Error fetching top trades:', error)
    } finally {
      setTradesLoading(false)
    }
  }

  const fetchPortfolioHistory = async (userAddress: string, page: number) => {
    setTradesLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio/history/${userAddress}/${page}`)
      if (!response.ok) throw new Error('Failed to fetch portfolio history')
      
      const data = await response.json()
      const trades = data.portfolio || []
      setPortfolioHistory(trades)
      setHasMore(data.hasMore || false)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching portfolio history:', error)
    } finally {
      setTradesLoading(false)
    }
  }

  const fetchPortfolioStats = async (userAddress: string) => {
    setStatsLoading(true)
    try {
      // Fetch profit/loss data from backend proxy
      const pnlResponse = await fetch(`${BACKEND_URL}/api/portfolio/profit-loss/${userAddress}`)
      if (!pnlResponse.ok) throw new Error('Failed to fetch PnL data')
      const pnlData = await pnlResponse.json()
      
      // Fetch win rate data from backend proxy
      const winRateResponse = await fetch(`${BACKEND_URL}/api/portfolio/win-rate/${userAddress}`)
      if (!winRateResponse.ok) throw new Error('Failed to fetch win rate data')
      const winRateData = await winRateResponse.json()
      
      if (pnlData.success && winRateData.success) {
        setPortfolioStats({
          totalPnl: pnlData.data[0]?.total || 0,
          totalCollateral: pnlData.data[0]?.totalCollateral || 0,
          totalTrades: pnlData.totalCount || 0,
          winRate: winRateData.winRate || 0
        })
      }
    } catch (error) {
      console.error('Error fetching portfolio stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleNextPage = () => {
    if (address && hasMore) {
      fetchPortfolioHistory(address, currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (address && currentPage > 0) {
      fetchPortfolioHistory(address, currentPage - 1)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 md:space-y-6 pb-20 md:pb-24"
    >
      {/* Profile Header */}
      {!userData && !address ? (
        <ProfileHeaderSkeleton />
      ) : (
        <div className="card">
        <div className="flex flex-row gap-4 md:gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isMiniApp && userData ? (
              <img
                src={userData.pfpUrl}
                alt={userData.displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl border-4 border-black/10 object-cover"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-2xl sm:rounded-3xl border-4 border-black/10 bg-black/5 flex items-center justify-center">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-black/30" />
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-row items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                {isMiniApp && userData ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold text-black mb-1">{userData.displayName}</h2>
                    <p className="text-sm text-black/50">@{userData.username}</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold text-black mb-1">Wallet</h2>
                    <p className="text-xs sm:text-sm text-black/50 font-mono break-all">{address}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                {isMiniApp && userData && (
                  <a
                    href={`https://farcaster.xyz/${userData.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2"
                  >
                    Farcaster <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* FID Display */}
            {isMiniApp && userData && (
              <div className="flex gap-4 sm:gap-6 mt-4 pt-4 border-t border-black/10">
                <div>
                  <p className="text-lg sm:text-xl font-bold text-black">{userData.fid}</p>
                  <p className="text-xs text-black/50">FID</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
            {/* Combined USDC and Portfolio Stats */}
            {address && (
              <div className="card">
                <h3 className="text-lg font-bold text-black mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Portfolio Overview
                  </span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* USDC Allowance */}
                  {usdcAllowance === undefined ? (
                    <div className="p-3 sm:p-4 bg-black/5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <SkeletonBox className="h-3 w-20" />
                        <SkeletonBox className="w-3 h-3 rounded-full" />
                      </div>
                      <SkeletonBox className="h-5 w-24" />
                    </div>
                  ) : (
                    <StatItem
                      label="USDC Allowance"
                      value={`${parseFloat(formatUnits(usdcAllowance, 6)).toFixed(2)} USDC`}
                      showPencilIcon={true}
                      onPencilClick={() => setShowApprovalModal(true)}
                    />
                  )}

                  {/* USDC Balance */}
                  {usdcBalance === undefined ? (
                    <div className="p-3 sm:p-4 bg-black/5 rounded-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <SkeletonBox className="h-3 w-20" />
                      </div>
                      <SkeletonBox className="h-5 w-24" />
                    </div>
                  ) : (
                    <StatItem
                      label="USDC Balance"
                      value={`${parseFloat(formatUnits(usdcBalance, 6)).toFixed(2)} USDC`}
                    />
                  )}

                  {/* Portfolio Stats */}
                  {statsLoading ? (
                    <>
                      <div className="p-3 sm:p-4 bg-black/5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <SkeletonBox className="h-3 w-16" />
                        </div>
                        <SkeletonBox className="h-5 w-20" />
                      </div>
                      <div className="p-3 sm:p-4 bg-black/5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <SkeletonBox className="h-3 w-16" />
                        </div>
                        <SkeletonBox className="h-5 w-20" />
                      </div>
                      <div className="p-3 sm:p-4 bg-black/5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <SkeletonBox className="h-3 w-16" />
                        </div>
                        <SkeletonBox className="h-5 w-20" />
                      </div>
                      <div className="p-3 sm:p-4 bg-black/5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1">
                          <SkeletonBox className="h-3 w-16" />
                        </div>
                        <SkeletonBox className="h-5 w-20" />
                      </div>
                    </>
                  ) : portfolioStats ? (
                    <>
                      <StatItem
                        label="Total PnL"
                        value={`${portfolioStats.totalPnl >= 0 ? '+' : ''}${portfolioStats.totalPnl.toFixed(2)} USDC`}
                        isProfit={portfolioStats.totalPnl >= 0}
                      />
                      <StatItem
                        label="Total Collateral"
                        value={`${portfolioStats.totalCollateral.toFixed(2)} USDC`}
                      />
                      <StatItem
                        label="Total Trades"
                        value={portfolioStats.totalTrades.toString()}
                      />
                      <StatItem
                        label="Win Rate"
                        value={`${(portfolioStats.winRate * 100).toFixed(1)}%`}
                        isProfit={portfolioStats.winRate >= 0.5}
                      />
                    </>
                  ) : null}
                </div>

                {/* USDC Approval Warning */}
                {usdcAllowance !== undefined && usdcAllowance === 0n && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                    <p className="text-sm text-orange-700">
                      ⚠️ No USDC approval set. Click the pencil icon to approve USDC for trading.
                    </p>
                  </div>
                )}
              </div>
            )}

      {/* Trading Activity */}
      {tradesLoading ? (
        <TradingActivitySkeleton />
      ) : (
        <div className="card">
        {/* Tabs */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-black/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap ${
              activeTab === 'activity'
                ? 'text-black'
                : 'text-black/40 hover:text-black/60'
            }`}
          >
            Activity
            {activeTab === 'activity' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all relative whitespace-nowrap ${
              activeTab === 'top'
                ? 'text-black'
                : 'text-black/40 hover:text-black/60'
            }`}
          >
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Top Trades</span>
              <span className="sm:hidden">Top</span>
            </span>
            {activeTab === 'top' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {tradesLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-black/50">Loading trades...</p>
          </div>
        ) : activeTab === 'activity' ? (
          // Activity Tab
          <>
            {portfolioHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-black/30" />
                </div>
                <p className="text-sm text-black/50 mb-2">No trading activity yet</p>
                <p className="text-xs text-black/40">
                  Your trade history will appear here once you start trading
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {portfolioHistory.map((trade) => {
                    const isLong = trade?.event?.args?.t?.buy ?? false
                    const netPnl = trade?.event?.args?.usdcSentToTrader - trade?.event?.args?.positionSizeUSDC 
                    const pnlPercentage = ((netPnl / trade?.event?.args?.positionSizeUSDC) * 100).toFixed(2)
                    const isProfit = netPnl > 0
                    const leverage = trade?.event?.args?.t?.leverage ?? 1
                    const timestamp = new Date(trade?.timeStamp ?? Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric', 
                      year: 'numeric'
                    })

                    return (
                      <motion.div
                        key={trade?._id ?? Math.random()}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 sm:p-4 bg-black/5 rounded-2xl hover:bg-black/10 transition-all cursor-pointer"
                        onClick={() => setSelectedTrade(trade)}
                      >
                        <div className="flex flex-row items-center gap-3 sm:gap-4">
                          {/* Asset Info */}
                          <div className="flex items-center gap-3 flex-1">
                            {trade?.pairInfo?.from ? (
                              <img
                                src={`https://www.avantisfi.com/images/pairs/crypto/${trade.pairInfo.from}.svg`}
                                alt={trade.pairInfo.from}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white p-1 flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-black/30" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                <h4 className="font-bold text-black text-sm sm:text-base">
                                  {trade?.pairInfo?.from && trade?.pairInfo?.to 
                                    ? `${trade.pairInfo.from}/${trade.pairInfo.to}` 
                                    : `Pair #${trade?.event?.args?.t?.pairIndex ?? 'Unknown'}`}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  isLong ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                }`}>
                                  {isLong ? (
                                    <span className="flex items-center gap-1">
                                      <ArrowUp className="w-3 h-3" /> <span className="hidden sm:inline">Long</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <ArrowDown className="w-3 h-3" /> <span className="hidden sm:inline">Short</span>
                                    </span>
                                  )}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-black/10 text-black/70">
                                  {leverage}x
                                </span>
                              </div>
                              <p className="text-xs text-black/50">{timestamp}</p>
                            </div>
                          </div>

                          {/* PnL */}
                          <div className="text-right">
                            <p className={`text-base sm:text-lg font-bold ${
                              isProfit ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isProfit ? '+' : ''}{netPnl.toFixed(2)} USDC
                            </p>
                            <p className={`text-xs ${
                              isProfit ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ({pnlPercentage}%)
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-black/10">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentPage === 0
                        ? 'bg-black/5 text-black/30 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-black/80'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-xs sm:text-sm text-black/50">Page {currentPage + 1}</span>
                  <button
                    onClick={handleNextPage}
                    disabled={!hasMore}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      !hasMore
                        ? 'bg-black/5 text-black/30 cursor-not-allowed'
                        : 'bg-black text-white hover:bg-black/80'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          // Top Trades Tab
          <>
            {topTrades.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-yellow-500/50" />
                </div>
                <p className="text-sm text-black/50 mb-2">No top trades yet</p>
                <p className="text-xs text-black/40">
                  Your best trades will appear here once you start trading
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topTrades.map((trade) => {
                  const isLong = trade.event.args.t.buy
                  const netPnl = trade.event.args.usdcSentToTrader - trade.event.args.positionSizeUSDC
                  const pnlPercentage = ((netPnl / trade.event.args.positionSizeUSDC) * 100).toFixed(2)
                  const isProfit = netPnl > 0
                  const leverage = trade.event.args.t.leverage
                  const timestamp = new Date(trade.timeStamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })

                  return (
                    <motion.div
                      key={trade._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 sm:p-4 bg-black/5 rounded-2xl hover:bg-black/10 transition-all cursor-pointer"
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <div className="flex flex-row items-center gap-3 sm:gap-4">
                        {/* Asset Info */}
                        <div className="flex items-center gap-3 flex-1">
                          {trade.pairInfo?.from ? (
                            <img
                              src={`https://www.avantisfi.com/images/pairs/crypto/${trade.pairInfo.from}.svg`}
                              alt={trade.pairInfo.from}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white p-1 flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/10 flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-black/30" />
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                              <h4 className="font-bold text-black text-sm sm:text-base">
                                {trade.pairInfo?.from && trade.pairInfo?.to ? `${trade.pairInfo.from}/${trade.pairInfo.to}` : `Pair #${trade.event.args.t.pairIndex}`}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isLong ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                              }`}>
                                {isLong ? (
                                  <span className="flex items-center gap-1">
                                    <ArrowUp className="w-3 h-3" /> <span className="hidden sm:inline">Long</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <ArrowDown className="w-3 h-3" /> <span className="hidden sm:inline">Short</span>
                                  </span>
                                )}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-black/10 text-black/70">
                                {leverage}x
                              </span>
                            </div>
                            <p className="text-xs text-black/50">{timestamp}</p>
                          </div>
                        </div>

                        {/* PnL */}
                        <div className="text-right">
                          <p className={`text-base sm:text-lg font-bold ${
                            isProfit ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isProfit ? '+' : ''}{netPnl.toFixed(2)} USDC
                          </p>
                          <p className={`text-xs ${
                            isProfit ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ({pnlPercentage}%)
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
      )}

      {/* Trade Details Modal */}
      {selectedTrade && (
        <TradeDetailsModal 
          trade={selectedTrade} 
          onClose={() => setSelectedTrade(null)} 
        />
      )}

      {/* USDC Approval Modal */}
      {showApprovalModal && address && usdcAllowance !== undefined && usdcBalance !== undefined && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          currentAllowance={usdcAllowance}
          userBalance={usdcBalance}
          userAddress={address}
          onRefetchAllowance={refetchAllowance}
        />
      )}
    </motion.div>
  )
}

function StatItem({ label, value, isProfit, showPencilIcon, onPencilClick }: { 
  label: string; 
  value: string; 
  isProfit?: boolean;
  showPencilIcon?: boolean;
  onPencilClick?: () => void;
}) {
  return (
    <div className="p-3 sm:p-4 bg-black/5 rounded-2xl">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs text-black/50">{label}</p>
        {showPencilIcon && onPencilClick && (
          <button
            onClick={onPencilClick}
            className="p-1 hover:bg-black/5 rounded-full transition-all"
            title="Edit"
          >
            <Edit3 className="w-3 h-3 text-black/60" />
          </button>
        )}
      </div>
      <p className={`text-base sm:text-lg font-bold ${
        isProfit !== undefined 
          ? (isProfit ? 'text-green-600' : 'text-red-600')
          : 'text-black'
      }`}>
        {value}
      </p>
    </div>
  )
}
