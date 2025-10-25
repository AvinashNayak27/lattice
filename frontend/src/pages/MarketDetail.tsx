import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, TrendingUp, ChevronLeft, Info, Maximize2, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import BottomSheet from '../components/BottomSheet'
import TradingViewWidget from '../components/TradingViewWidget'
import { useAccount } from 'wagmi'

interface MarketDetailProps {
  pairs: any[]
  onOpenTrade: () => void
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
  onPairSelect: (index: number) => void
}

export default function MarketDetail({
  pairs,
  onOpenTrade,
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
  onPairSelect
}: MarketDetailProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const [price, setPrice] = useState<number | null>(null)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [priceChange24h, setPriceChange24h] = useState<number>(0)
  const [price24hAgo, setPrice24hAgo] = useState<number | null>(null)
  const [isFullScreenChart, setIsFullScreenChart] = useState(false)
  const fullScreenChartRef = useRef<HTMLDivElement>(null)

  const pairIndex = parseInt(id || '0')
  const pair = pairs.find(p => p.index === pairIndex)

  useEffect(() => {
    if (pair) {
      onPairSelect(pairIndex)
    }
  }, [pairIndex, pair, onPairSelect])

  // Fetch 24h ago price from backend for price change calculation
  useEffect(() => {
    const fetch24hPrice = async () => {
      try {
        if (!pair) return

        const response = await fetch(`https://84de2d582240.ngrok-free.app/api/price-feeds/last-price/${pairIndex}`, {
          headers: {
            'ngrok-skip-browser-warning': '1'
          }
        })
        if (!response.ok) throw new Error('Failed to fetch 24h price')
        
        const data = await response.json()
        if (data && typeof data.c === 'number') {
          setPrice24hAgo(data.c)
        }
      } catch (e) {
        console.error('Failed to fetch 24h price from backend', e)
      }
    }

    if (pair) {
      fetch24hPrice()
    }
  }, [pair, pairIndex])

  // Calculate 24h price change when both current price and 24h ago price are available
  useEffect(() => {
    if (price !== null && price24hAgo !== null && price24hAgo !== 0) {
      const change = ((price - price24hAgo) / price24hAgo) * 100
      setPriceChange24h(change)
    }
  }, [price, price24hAgo])

  // Handle escape key to close full-screen chart
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreenChart) {
        console.log('[MarketDetail] Closing full screen chart via Escape key')
        setIsFullScreenChart(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullScreenChart])

  // Log full screen state changes
  useEffect(() => {
    console.log('[MarketDetail] Full screen chart state:', isFullScreenChart)
  }, [isFullScreenChart])

  // WebSocket price updates
  useEffect(() => {
    const feedId = pair?.raw?.feed?.feedId
    if (!feedId) return

    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let isSubscribed = false

    const connect = () => {
      try {
        ws = new WebSocket('wss://hermes.pyth.network/ws')

        ws.onopen = () => {
          console.log('WebSocket connected')
          // Subscribe to price updates for this feed
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'subscribe',
              ids: [feedId]
            }))
            isSubscribed = true
          }
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Handle price update messages
            if (data.type == 'price_update' && data.price_feed) {
              const priceFeed = data.price_feed
              if (priceFeed.id.toLowerCase().replace(/^0x/, '') === feedId.toLowerCase().replace(/^0x/, '')) {
                const p = priceFeed.price
                if (p && p.price !== undefined && typeof p.expo === 'number') {
                  // Handle price as either string or number
                  const priceValue = typeof p.price === 'string' ? p.price : String(p.price)
                  const parsedPrice = Number(priceValue) * Math.pow(10, p.expo)
                
                  
                  setPrice(parsedPrice)

                  // Set default TP/SL based on direction (only once)
                  if (tp === '0' || !tp) {
                    setTp(String(Number((parsedPrice * (isLong ? 1.15 : 0.85)).toFixed(2))))
                  }
                  if (sl === '0' || !sl) {
                    setSl(String(Number((parsedPrice * (isLong ? 0.95 : 1.05)).toFixed(2))))
                  }
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message', e)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
          isSubscribed = false
          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...')
            connect()
          }, 5000)
        }
      } catch (e) {
        console.error('Failed to create WebSocket connection', e)
      }
    }

    connect()

    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        if (isSubscribed && ws.readyState === WebSocket.OPEN) {
          // Unsubscribe before closing
          ws.send(JSON.stringify({
            type: 'unsubscribe',
            ids: [feedId]
          }))
        }
        ws.close()
      }
    }
  }, [pair, isLong])

  const handleOpenTradeModal = (long: boolean) => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    setIsLong(long)
    setShowTradeModal(true)
  }

  const handleConfirmTrade = () => {
    onOpenTrade()
    setShowTradeModal(false)
  }

  if (!pair) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-black/50">Market not found</p>
      </motion.div>
    )
  }

  const positionSize = Number(collateral) * Number(leverage)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6 pb-32 md:pb-6"
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/markets')}
          className="flex items-center gap-2 text-black/70 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back to Markets</span>
        </button>

        {/* Market Header */}
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">{pair.name}</h1>
              <span className="text-xs text-black/40">Market #{pair.index}</span>
            </div>
            <div className="px-3 py-1 bg-green-500/10 rounded-lg">
              <span className="text-xs font-semibold text-green-600">LIVE</span>
            </div>
          </div>

          {/* Price Display */}
          {price ? (
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <p className="text-4xl font-bold text-black">
                  ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${priceChange24h >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {priceChange24h >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <div>
                    <span className={`text-sm font-semibold ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                    </span>
                    <p className="text-xs text-black/50">24h Change</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse">
              <div className="h-10 bg-black/10 rounded w-48 mb-2" />
              <div className="h-4 bg-black/10 rounded w-24" />
            </div>
          )}
        </div>

        {/* TradingView Chart */}
        <div className="card relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-black">Price Chart</h3>
            <button
              onClick={() => {
                console.log('[MarketDetail] Opening full screen chart')
                console.log('[MarketDetail] Pair:', pair)
                console.log('[MarketDetail] Symbol:', `PYTH:${pair.from}${pair.to === 'USDC' ? 'USD' : pair.to}`)
                setIsFullScreenChart(true)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-black/5 hover:bg-black/10 rounded-lg transition-colors z-10 relative"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Full Screen</span>
            </button>
          </div>
          <TradingViewWidget 
            symbol={`PYTH:${pair.from}${pair.to === 'USDC' ? 'USD' : pair.to}`}
          />
        </div>

        {/* Market Stats
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="24h Volume" value="$4.2M" />
          <StatCard label="Max Leverage" value={`${pair.raw?.leverages?.maxLeverage || 75}x`} />
        </div> */}

        {/* Market Info */}
        <div className="card">
          <h3 className="text-lg font-bold text-black mb-4">Market Information</h3>
          <div className="space-y-3">
            <InfoRow label="Base Asset" value={pair.from || 'N/A'} />
            <InfoRow label="Quote Asset" value={pair.to || 'USDC'} />
            <InfoRow label="Min Leverage" value={`${pair.raw?.leverages?.minLeverage || 1}x`} />
            <InfoRow label="Max Leverage" value={`${pair.raw?.leverages?.maxLeverage || 75}x`} />
            <InfoRow label="Trading Fee" value="0.06%" />
          </div>
        </div>

        {/* About Section */}
        <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-black mb-2">About {pair.from} Trading</h4>
              <p className="text-xs text-black/70 leading-relaxed">
                Trade {pair.name} with up to {pair.raw?.leverages?.maxLeverage || 75}x leverage. 
                Set your take profit and stop loss levels to manage risk effectively. 
                All trades are settled in USDC.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fixed Bottom Trading Buttons - Mobile Only */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-white via-white to-transparent pt-6 z-40">
        <div className="grid grid-cols-2 gap-3 max-w-screen-sm mx-auto">
          <button
            onClick={() => handleOpenTradeModal(true)}
            disabled={!isConnected}
            className="btn-success flex items-center justify-center gap-2 py-4 shadow-2xl"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span className="font-bold">Long</span>
          </button>
          <button
            onClick={() => handleOpenTradeModal(false)}
            disabled={!isConnected}
            className="btn-danger flex items-center justify-center gap-2 py-4 shadow-2xl"
          >
            <ArrowDownRight className="w-5 h-5" />
            <span className="font-bold">Short</span>
          </button>
        </div>
      </div>

      {/* Desktop Trading Buttons */}
      <div className="hidden md:block fixed bottom-8 right-8 z-40">
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenTradeModal(true)}
            disabled={!isConnected}
            className="btn-success flex items-center gap-2 py-4 px-8 shadow-2xl"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span className="font-bold">Open Long</span>
          </button>
          <button
            onClick={() => handleOpenTradeModal(false)}
            disabled={!isConnected}
            className="btn-danger flex items-center gap-2 py-4 px-8 shadow-2xl"
          >
            <ArrowDownRight className="w-5 h-5" />
            <span className="font-bold">Open Short</span>
          </button>
        </div>
      </div>

      {/* Trade Modal - Bottom Sheet */}
      <BottomSheet
        isOpen={showTradeModal}
        onClose={() => setShowTradeModal(false)}
        title={`Open ${isLong ? 'Long' : 'Short'} Position`}
      >
        <div className="space-y-6 pb-24">
          {/* Position Direction Indicator */}
          <div className={`p-4 rounded-2xl ${isLong ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <div className="flex items-center gap-3">
              {isLong ? <ArrowUpRight className="w-6 h-6 text-green-600" /> : <ArrowDownRight className="w-6 h-6 text-red-600" />}
              <div>
                <p className={`font-bold ${isLong ? 'text-green-600' : 'text-red-600'}`}>
                  {isLong ? 'Long' : 'Short'} {pair.name}
                </p>
                <p className="text-xs text-black/50">
                  Current Price: ${price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Collateral Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-black">Collateral (USDC)</label>
              <span className="text-xs text-black/50">Balance: 1,000 USDC</span>
            </div>
            <input
              type="number"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              className="w-full px-4 py-3 bg-black/5 border border-black/10 rounded-2xl text-black font-semibold text-lg"
              placeholder="100"
            />
          </div>

          {/* Leverage Slider */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-black">Leverage</label>
              <span className="text-lg font-bold text-black">{leverage}x</span>
            </div>
            <input
              type="range"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              min={leverageMin ?? 1}
              max={leverageMax ?? 75}
              step="1"
              className="w-full h-3 bg-gradient-to-r from-green-500 to-red-500 rounded-full appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, ${isLong ? '#10b981' : '#ef4444'} 0%, ${isLong ? '#10b981' : '#ef4444'} ${(Number(leverage) - (leverageMin ?? 1)) / ((leverageMax ?? 75) - (leverageMin ?? 1)) * 100}%, #e5e7eb ${(Number(leverage) - (leverageMin ?? 1)) / ((leverageMax ?? 75) - (leverageMin ?? 1)) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-black/50">{leverageMin ?? 1}x</span>
              <span className="text-xs text-black/50">{leverageMax ?? 75}x</span>
            </div>
          </div>

          {/* TP/SL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-black block mb-2">Take Profit</label>
              <input
                type="number"
                value={tp}
                onChange={(e) => setTp(e.target.value)}
                className="w-full px-3 py-2 bg-black/5 border border-black/10 rounded-xl text-black text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-black block mb-2">Stop Loss</label>
              <input
                type="number"
                value={sl}
                onChange={(e) => setSl(e.target.value)}
                className="w-full px-3 py-2 bg-black/5 border border-black/10 rounded-xl text-black text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Position Summary */}
          <div className="p-4 bg-black/5 rounded-2xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-black/60">Position Size</span>
              <span className="font-bold text-black">${positionSize.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-black/60">Entry Price</span>
              <span className="font-semibold text-black">${price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-black/60">Liquidation Price</span>
              <span className="font-semibold text-red-600">
                ${price ? (isLong ? (price * 0.9) : (price * 1.1)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
              </span>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmTrade}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg ${
              isLong ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50 transition-all`}
          >
            {loading ? 'Processing...' : `Confirm ${isLong ? 'Long' : 'Short'} Position`}
          </button>
        </div>
      </BottomSheet>

      {/* Custom slider styles */}
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid ${isLong ? '#10b981' : '#ef4444'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 3px solid ${isLong ? '#10b981' : '#ef4444'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>

      {/* Full Screen Chart Modal */}
      {isFullScreenChart && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-white"
          style={{ isolation: 'isolate' }}
        >
          <div className="h-full w-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-black/10 bg-white z-10">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg md:text-xl font-bold text-black">{pair.name} Chart</h2>
                {price && (
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-lg font-semibold text-black">
                      ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs md:text-sm font-semibold ${priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  console.log('[MarketDetail] Closing full screen chart via X button')
                  setIsFullScreenChart(false)
                }}
                className="p-2 hover:bg-black/5 rounded-lg transition-colors shrink-0"
                aria-label="Close full screen chart"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            {/* Full Screen Chart */}
            <div 
              className="flex-1 w-full overflow-hidden" 
              ref={fullScreenChartRef}
              style={{ height: 'calc(100vh - 64px)' }}
            >
              <TradingViewWidget 
                symbol={`PYTH:${pair.from}${pair.to === 'USDC' ? 'USD' : pair.to}`}
                fullscreen={true}
              />
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <p className="text-xs text-black/50 mb-1">{label}</p>
      <p className="font-bold text-base text-black">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-black/5 last:border-0">
      <span className="text-sm text-black/60">{label}</span>
      <span className="text-sm font-semibold text-black">{value}</span>
    </div>
  )
}


