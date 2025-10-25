import { motion } from 'framer-motion'
import { Wallet, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react'

interface TradeProps {
  isConnected: boolean
  pairs: any[]
  selectedPairIndex: number | null
  setSelectedPairIndex: (index: number) => void
  price: number | null
  collateral: string
  setCollateral: (val: string) => void
  leverage: string
  setLeverage: (val: string) => void
  leverageMin: number | null
  leverageMax: number | null
  isLong: boolean
  setIsLong: (val: boolean) => void
  tp: string
  setTp: (val: string) => void
  sl: string
  setSl: (val: string) => void
  loading: boolean
  onOpenTrade: () => void
}

export default function Trade({
  isConnected,
  pairs,
  selectedPairIndex,
  setSelectedPairIndex,
  price,
  collateral,
  setCollateral,
  leverage,
  setLeverage,
  leverageMin,
  leverageMax,
  isLong,
  setIsLong,
  tp,
  setTp,
  sl,
  setSl,
  loading,
  onOpenTrade
}: TradeProps) {
  const positionSize = Number(collateral) * Number(leverage)
  const selectedPair = pairs.find((p: any) => p.index === selectedPairIndex)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {!isConnected ? (
        <div className="card text-center py-12">
          <Wallet className="w-16 h-16 mx-auto text-black/20 mb-4" />
          <h3 className="text-lg font-bold text-black mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-black/50">Connect your wallet to start trading</p>
        </div>
      ) : (
        <>
          {/* Pair Selection */}
          <div className="card">
            <label className="label-text">Select Trading Pair</label>
            <select
              value={selectedPairIndex ?? ''}
              onChange={(e) => setSelectedPairIndex(Number(e.target.value))}
              className="input-field"
            >
              {pairs.map((p: any) => (
                <option key={p.index} value={p.index}>
                  {p.name} (#{p.index})
                </option>
              ))}
            </select>
            <div className="mt-4 p-4 bg-black/5 rounded-2xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-black/60">Current Price</span>
                {price !== null ? (
                  <span className="text-xl font-bold text-black">
                    ${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </span>
                ) : (
                  <span className="text-black/30 text-sm">Loading...</span>
                )}
              </div>
            </div>
          </div>

          {/* Direction Toggle */}
          <div className="card">
            <label className="label-text mb-3">Direction</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setIsLong(true)}
                className={`p-4 rounded-2xl font-semibold transition-all ${
                  isLong
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-black/5 text-black/70 hover:bg-black/10'
                }`}
              >
                <ArrowUpRight className="w-5 h-5 mx-auto mb-1" />
                Long
              </button>
              <button
                onClick={() => setIsLong(false)}
                className={`p-4 rounded-2xl font-semibold transition-all ${
                  !isLong
                    ? 'bg-red-600 text-white shadow-lg scale-105'
                    : 'bg-black/5 text-black/70 hover:bg-black/10'
                }`}
              >
                <ArrowDownRight className="w-5 h-5 mx-auto mb-1" />
                Short
              </button>
            </div>
          </div>

          {/* Trading Parameters */}
          <div className="card space-y-4">
            <div>
              <label className="label-text">Collateral (USDC)</label>
              <input
                type="number"
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
                min="0"
                step="0.01"
                className="input-field"
                placeholder="Enter collateral amount"
              />
            </div>

            <div>
              <label className="label-text">
                Leverage {leverageMin && leverageMax && `(${leverageMin}x - ${leverageMax}x)`}
              </label>
              <input
                type="range"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                min={leverageMin ?? 1}
                max={leverageMax ?? 75}
                step="1"
                className="w-full h-2 bg-black/10 rounded-full appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-black/60">Current: {leverage}x</span>
                <input
                  type="number"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  min={leverageMin ?? 1}
                  max={leverageMax ?? 75}
                  className="w-24 px-3 py-1 bg-white border border-black/10 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Take Profit</label>
                <input
                  type="number"
                  value={tp}
                  onChange={(e) => setTp(e.target.value)}
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label-text">Stop Loss</label>
                <input
                  type="number"
                  value={sl}
                  onChange={(e) => setSl(e.target.value)}
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card">
            <h3 className="text-base font-bold text-black mb-4">Order Summary</h3>

            <div className="space-y-3">
              <SummaryRow label="Pair" value={selectedPair?.name ?? '—'} />
              <SummaryRow label="Direction" value={isLong ? 'Long' : 'Short'} valueColor={isLong ? 'text-green-600' : 'text-red-600'} />
              <SummaryRow label="Collateral" value={`$${Number(collateral).toLocaleString()}`} />
              <SummaryRow label="Leverage" value={`${leverage}x`} />
              <div className="border-t border-black/10 pt-3 mt-3">
                <SummaryRow label="Position Size" value={`$${positionSize.toLocaleString()}`} bold />
              </div>
              {tp !== '0' && <SummaryRow label="Take Profit" value={`$${Number(tp).toLocaleString()}`} />}
              {sl !== '0' && <SummaryRow label="Stop Loss" value={`$${Number(sl).toLocaleString()}`} />}
            </div>
            <button
              onClick={onOpenTrade}
              disabled={loading}
              className={`w-full mt-6 ${isLong ? 'btn-success' : 'btn-danger'}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                  Processing...
                </>
              ) : (
                <>Open {isLong ? 'Long' : 'Short'} Position</>
              )}
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}

function SummaryRow({ label, value, bold, valueColor }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-black/60">{label}</span>
      <span className={`${bold ? 'font-bold text-base' : 'font-semibold text-sm'} ${valueColor ?? 'text-black'}`}>
        {value}
      </span>
    </div>
  )
}

