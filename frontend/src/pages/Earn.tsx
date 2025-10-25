import { motion } from 'framer-motion'
import { TrendingUp, Wallet, Lock, Info, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function Earn() {
  const [selectedPool, setSelectedPool] = useState<'usdc' | 'avnt' | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')

  const pools = [
    {
      id: 'usdc',
      name: 'USDC Pool',
      token: 'USDC',
      apy: '12.5%',
      tvl: '$8.2M',
      userStaked: '0',
      description: 'Stake USDC to earn trading fee rewards',
      lockPeriod: 'Flexible',
      minStake: '10 USDC'
    },
    {
      id: 'avnt',
      name: 'AVNT Pool',
      token: 'AVNT',
      apy: '24.8%',
      tvl: '$3.4M',
      userStaked: '0',
      description: 'Stake AVNT tokens for boosted rewards',
      lockPeriod: '30 days',
      minStake: '100 AVNT'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Earn Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Value Locked"
          value="$11.6M"
          icon={<Lock className="w-5 h-5" />}
        />
        <StatsCard
          title="Your Earnings"
          value="$0.00"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatsCard
          title="Active Stakers"
          value="2,456"
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatsCard
          title="Avg APY"
          value="18.6%"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Staking Pools */}
      <div className="card">
        <h3 className="text-lg font-bold text-black mb-4">Staking Pools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map((pool) => (
            <motion.div
              key={pool.id}
              whileHover={{ scale: 1.02 }}
              className="p-5 rounded-2xl border-2 border-black/10 hover:border-black/30 transition-all cursor-pointer bg-gradient-to-br from-white to-gray-50"
              onClick={() => setSelectedPool(pool.id as 'usdc' | 'avnt')}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-base text-black">{pool.name}</h4>
                  <p className="text-xs text-black/50 mt-1">{pool.description}</p>
                </div>
                <div className="px-3 py-1 bg-green-500/10 rounded-lg">
                  <span className="text-sm font-bold text-green-600">{pool.apy}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-black/50">TVL</span>
                  <span className="font-semibold text-black">{pool.tvl}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-black/50">Lock Period</span>
                  <span className="font-semibold text-black">{pool.lockPeriod}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-black/50">Min Stake</span>
                  <span className="font-semibold text-black">{pool.minStake}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-black/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-black/50">Your Stake</p>
                    <p className="font-semibold text-sm text-black">{pool.userStaked} {pool.token}</p>
                  </div>
                  <button className="px-4 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-black/90 transition-all flex items-center gap-2">
                    Stake <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="card">
        <h3 className="text-lg font-bold text-black mb-4">How Staking Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-black/5 rounded-2xl">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center mb-3 font-bold">
              1
            </div>
            <h4 className="font-semibold text-sm text-black mb-2">Choose a Pool</h4>
            <p className="text-xs text-black/60">
              Select USDC or AVNT pool based on your preference and APY
            </p>
          </div>
          <div className="p-4 bg-black/5 rounded-2xl">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center mb-3 font-bold">
              2
            </div>
            <h4 className="font-semibold text-sm text-black mb-2">Stake Tokens</h4>
            <p className="text-xs text-black/60">
              Deposit your tokens and start earning rewards immediately
            </p>
          </div>
          <div className="p-4 bg-black/5 rounded-2xl">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center mb-3 font-bold">
              3
            </div>
            <h4 className="font-semibold text-sm text-black mb-2">Earn Rewards</h4>
            <p className="text-xs text-black/60">
              Claim rewards anytime and compound your earnings
            </p>
          </div>
        </div>
      </div>

      {/* Risk Notice */}
      <div className="card bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-sm text-yellow-900 mb-1">Important Notice</h4>
            <p className="text-xs text-yellow-800">
              Staking involves risks. APY rates are variable and subject to change. AVNT pool has a 30-day lock period. 
              Always do your own research and only stake what you can afford.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatsCard({ title, value, icon }: any) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-black/60">{title}</p>
        <div className="p-2 rounded-xl bg-black text-white">
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold text-black">{value}</p>
    </div>
  )
}

