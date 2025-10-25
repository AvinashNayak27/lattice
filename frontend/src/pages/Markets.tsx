import { motion } from 'framer-motion'
import { TrendingUp, ArrowUpRight, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type PairInfo = {
  name: string
  index: number
  from: string
  to: string
  raw: any
}

interface MarketsProps {
  pairs: PairInfo[]
  onPairSelect: (index: number) => void
}

export default function Markets({ pairs, onPairSelect }: MarketsProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [pairPrices, setPairPrices] = useState<Record<number, number>>({})
  const [historicalPrices, setHistoricalPrices] = useState<Record<number, number>>({})
  const [showAll, setShowAll] = useState(false)

  // Fetch prices for all pairs (WebSocket only)
  useEffect(() => {
    if (pairs.length === 0) return

    // Create a map of feedId to pair indices for quick lookup
    const feedIdToPairIndices = new Map<string, number[]>()
    pairs.forEach((pair) => {
      const feedId = pair.raw?.feed?.feedId
      if (feedId) {
        if (!feedIdToPairIndices.has(feedId)) {
          feedIdToPairIndices.set(feedId.slice(2), [])
        }
        feedIdToPairIndices.get(feedId.slice(2))!.push(pair.index)
      }
    })

    const rawFeedIds = Array.from(feedIdToPairIndices.keys())

    const feedIds = rawFeedIds.filter(feedId => feedId !== 'b98e7ae8af2d298d2651eb21ab5b8b5738212e13efb43bd0dfbce7a74ba4b5d0')

    if (feedIds.length === 0) return

    // Setup WebSocket for real-time updates
    const wsUrl = `wss://hermes.pyth.network/ws`
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('Pyth WebSocket connected')
          // Subscribe to price updates for all feedIds
          ws?.send(JSON.stringify({
            type: 'subscribe',
            ids: feedIds
          }))
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data?.type === 'price_update' && data?.price_feed) {
              const feedId = data.price_feed.id
              const p = data.price_feed.price
              
              if (feedId && p && typeof p?.price === 'string' && typeof p?.expo === 'number') {
                const price = Number(p.price) * Math.pow(10, p.expo)
                const pairIndices = feedIdToPairIndices.get(feedId)
                console.log('pairIndices', pairIndices)
                
                if (pairIndices) {
                  const priceUpdates: Record<number, number> = {}
                  pairIndices.forEach(index => {
                    priceUpdates[index] = price
                  })
                  setPairPrices(prev => ({ ...prev, ...priceUpdates }))
                }
              }
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('Pyth WebSocket disconnected, reconnecting in 5s...')
          // Reconnect after 5 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 5000)
        }
      } catch (e) {
        console.error('Error connecting to WebSocket:', e)
        reconnectTimeout = setTimeout(connectWebSocket, 5000)
      }
    }

    connectWebSocket()

    // Cleanup
    return () => {
      if (ws) {
        ws.close()
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [pairs])

  // Fetch historical prices from backend API
  useEffect(() => {
    const fetchHistoricalPrices = async () => {
      try {
        const res = await fetch('https://84de2d582240.ngrok-free.app/api/price-feeds/last-price', {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })
        const data = await res.json()
        
        if (Array.isArray(data)) {
          const priceMap: Record<number, number> = {}
          data.forEach((item: any) => {
            if (typeof item?.pairIndex === 'number' && typeof item?.c === 'number') {
              priceMap[item.pairIndex] = item.c
            }
          })
          setHistoricalPrices(priceMap)
        }
      } catch (e) {
        console.error('Error fetching historical prices:', e)
      }
    }

    fetchHistoricalPrices()
  }, [])

  // Filter pairs based on search
  const filteredPairs = pairs.filter(pair => 
    pair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pair.to?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show only first 10 initially
  const displayedPairs = showAll ? filteredPairs : filteredPairs.slice(0, 10)

  const handlePairClick = (pair: PairInfo) => {
    onPairSelect(pair.index)
    navigate(`/markets/${pair.index}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Market Stats */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Markets"
          value={pairs.length.toString()}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatsCard
          title="24h Volume"
          value="$12.4M"
          icon={<ArrowUpRight className="w-5 h-5" />}
        />
        <StatsCard
          title="Total TVL"
          value="$45.2M"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatsCard
          title="Active Traders"
          value="1,234"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div> */}

      {/* Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
          <input
            type="text"
            placeholder="Search markets (ETH, BTC, etc.)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-black/5 border border-black/10 rounded-2xl text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
          />
        </div>
      </div>

      {/* Markets Grid */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-black">Available Markets</h3>
          <span className="text-xs text-black/50">
            Showing {displayedPairs.length} of {filteredPairs.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayedPairs.map((pair: PairInfo) => {
            const price = pairPrices[pair.index]
            const historicalPrice = historicalPrices[pair.index]
            const priceChange = price && historicalPrice 
              ? ((price - historicalPrice) / historicalPrice) * 100 
              : 0

            return (
              <motion.div
                key={pair.index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePairClick(pair)}
                className="p-4 rounded-2xl border-2 border-black/10 hover:border-black/30 cursor-pointer transition-all bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-base text-black">{pair.name}</h4>
                    <span className="text-xs text-black/40">#{pair.index}</span>
                  </div>
                  {price && (
                    <div className="px-2 py-1 bg-green-500/10 rounded-lg">
                      <span className="text-xs font-semibold text-green-600">LIVE</span>
                    </div>
                  )}
                </div>

                {price ? (
                  <div className="mt-3">
                    <p className="text-xl font-bold text-black">
                      ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className={`w-3 h-3 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500 rotate-90'}`} />
                      <span className={`text-xs ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="h-6 bg-black/5 rounded animate-pulse" />
                    <div className="h-4 bg-black/5 rounded mt-2 w-16 animate-pulse" />
                  </div>
                )}

                {pair.raw?.leverages && (
                  <div className="mt-3 pt-3 border-t border-black/10">
                    <span className="text-xs text-black/50">
                      Max Leverage: <span className="font-semibold text-black">{pair.raw.leverages.maxLeverage}x</span>
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Show More Button */}
        {!showAll && filteredPairs.length > 10 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="btn-secondary"
            >
              Show All Markets ({filteredPairs.length - 10} more)
            </button>
          </div>
        )}
      </div>

      {/* Popular Pairs */}
      {/* <div className="card">
        <h3 className="text-lg font-bold text-black mb-4">Trending This Week</h3>
        <div className="space-y-3">
          {pairs.slice(0, 5).map((pair, index) => {
            const price = pairPrices[pair.index]
            const priceChange = Math.random() * 10 - 5

            return (
              <div
                key={pair.index}
                className="flex items-center justify-between p-3 bg-black/5 rounded-xl hover:bg-black/10 transition-all cursor-pointer"
                onClick={() => handlePairClick(pair)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-black/40">#{index + 1}</span>
                  <div>
                    <p className="font-semibold text-sm text-black">{pair.name}</p>
                    <p className="text-xs text-black/50">24h Vol: $2.4M</p>
                  </div>
                </div>
                <div className="text-right">
                  {price ? (
                    <>
                      <p className="font-semibold text-sm text-black">
                        ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        <ArrowUpRight className={`w-3 h-3 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600 rotate-90'}`} />
                        <span className={`text-xs ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="h-4 w-20 bg-black/5 rounded animate-pulse" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div> */}
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
