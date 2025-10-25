import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, TrendingUp, RefreshCw, X, ArrowUpRight, ArrowDownRight, Edit3, Check, Eye } from 'lucide-react'
import { useState } from 'react'
import { calculatePnL } from '../utils/pnlCalculations'

interface PortfolioProps {
  isConnected: boolean
  trades: any[]
  pendingOrders: any[]
  getPairName: (idx: number | null | undefined) => string
  loading: boolean
  onCloseTrade: (pairIndex: number, tradeIndex: number) => void
  onUpdateTpSl: (pairIndex: number, tradeIndex: number, newTp: number, newSl: number) => void
  pairs: any[]
  realtimePrices: Record<string, number>
}

export default function Portfolio({
  isConnected,
  trades,
  pendingOrders,
  getPairName,
  loading,
  onCloseTrade,
  onUpdateTpSl,
  pairs,
  realtimePrices
}: PortfolioProps) {
  const [editingTpSl, setEditingTpSl] = useState<Record<string, { tp: string; sl: string }>>({})
  const [pnlDetailsModal, setPnlDetailsModal] = useState<{ show: boolean, data: any }>({ show: false, data: null })
  const [showTpSlEditor, setShowTpSlEditor] = useState<Record<string, boolean>>({})
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null)

  const getRealtimePrice = (pairIndex: number): number | null => {
    const pair = pairs.find((p: any) => p.index === pairIndex);
    const feedId = pair?.raw?.feed?.feedId;
    if (!feedId) return null;
    const price =
      realtimePrices[feedId.toLowerCase().replace(/^0x/, "")] ??
      realtimePrices[feedId];
    return typeof price === "number" ? price : null;
  }

  // Calculate total net PnL
  const totalNetPnL = trades.reduce((sum, t) => {
    const pnlData = calculatePnL({
      ...t,
      openPrice: Number(t.openPrice),
      collateral: Number(t.collateral),
      leverage: Number(t.leverage),
      liquidationPrice: t.liquidationPrice ? Number(t.liquidationPrice) : undefined,
      tp: t.tp ? Number(t.tp) : 0,
      sl: t.sl ? Number(t.sl) : 0,
    }, null, getRealtimePrice);

    if (!pnlData) return sum;
    const netPnl = pnlData.type === 'nonZeroFeePerp' ? (pnlData as any).netPnl : (pnlData as any).pnl;
    return sum + netPnl;
  }, 0)

  const portfolioValue = trades.reduce((sum, t) => {
    const collateral = Number(t.collateral) / 1e6;
    return sum + collateral;
  }, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 mb-20 md:mb-6"
    >
      {!isConnected ? (
        <div className="card text-center py-12">
          <Wallet className="w-16 h-16 mx-auto text-black/20 mb-4" />
          <h3 className="text-lg font-bold text-black mb-2">Connect Your Wallet</h3>
          <p className="text-sm text-black/50">Connect your wallet to view your portfolio</p>
        </div>
      ) : (
        <>
          {/* Portfolio Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatsCard
              title="Portfolio Value"
              value={`$${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              icon={<Wallet className="w-5 h-5" />}
            />
            <StatsCard
              title="Net P&L"
              value={`$${totalNetPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              icon={totalNetPnL >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              valueColor={totalNetPnL >= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>

          {/* PnL Details Modal */}
          <AnimatePresence>
            {pnlDetailsModal.show && pnlDetailsModal.data && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setPnlDetailsModal({ show: false, data: null })}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-3xl shadow-2xl border border-black/10 max-w-md w-full p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-black">PnL Details</h3>
                    <button
                      onClick={() => setPnlDetailsModal({ show: false, data: null })}
                      className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-black" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {pnlDetailsModal.data.type === 'nonZeroFeePerp' ? (
                      <>
                        <div className="p-4 bg-black/5 rounded-2xl border border-black/10">
                          <div className="text-xs text-black/60 mb-1">Gross PnL</div>
                          <div className="text-base font-semibold text-black">
                            ${pnlDetailsModal.data.grossPnl.toFixed(2)}
                            <span className="text-xs text-black/60 ml-2">
                              ({pnlDetailsModal.data.grossPnlPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-black/5 rounded-2xl border border-black/10">
                          <div className="text-xs text-black/60 mb-1">Closing Fee</div>
                          <div className="text-base font-semibold text-red-600">
                            -${pnlDetailsModal.data.closingFee.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-4 bg-black/5 rounded-2xl border border-black/10">
                          <div className="text-xs text-black/60 mb-1">Rollover Fee</div>
                          <div className="text-base font-semibold text-red-600">
                            -${pnlDetailsModal.data.rolloverFee.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-4 bg-black/5 rounded-2xl border-2 border-black/20">
                          <div className="text-xs text-black/70 mb-1">Net PnL</div>
                          <div className={`text-xl font-bold ${pnlDetailsModal.data.netPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnlDetailsModal.data.netPnl >= 0 ? '+' : ''}
                            ${pnlDetailsModal.data.netPnl.toFixed(2)}
                            <span className="text-base ml-2">{pnlDetailsModal.data.netPnlPercent.toFixed(2)}%</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-black/5 rounded-2xl border border-black/10">
                          <div className="text-xs text-black/60 mb-1">Gross PnL</div>
                          <div className="text-base font-semibold text-black">
                            ${pnlDetailsModal.data.grossPnl.toFixed(2)}
                            <span className="text-xs text-black/60 ml-2">
                              ({pnlDetailsModal.data.grossPnlPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                        <div className="p-4 bg-black/5 rounded-2xl border border-black/10">
                          <div className="text-xs text-black/60 mb-1">PnL-Based Fee</div>
                          <div className="text-base font-semibold text-red-600">
                            -${pnlDetailsModal.data.fee.toFixed(2)}
                          </div>
                        </div>
                        <div className="p-4 bg-black/5 rounded-2xl border-2 border-black/20">
                          <div className="text-xs text-black/70 mb-1">Net PnL</div>
                          <div className={`text-xl font-bold ${pnlDetailsModal.data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pnlDetailsModal.data.pnl >= 0 ? '+' : ''}
                            ${pnlDetailsModal.data.pnl.toFixed(2)}
                            <span className="text-base ml-2">{pnlDetailsModal.data.pnlPercent.toFixed(2)}%</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Open Positions */}
          <div className="card">
            <h3 className="text-lg font-bold text-black mb-4">Open Positions ({trades.length})</h3>
            {trades.length === 0 ? (
              <div className="text-center py-8 text-black/40">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />  
                <p className="text-sm">No open positions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trades.map((t: any) => {
                  const pidx = t.pairIndex;
                  const tidx = t.index;
                  const key = `${pidx}:${tidx}`;
                  const isLong = t.buy;
                  const leverage = Number(t.leverage) / 1e10;
                  const collateral = Number(t.collateral) / 1e6;
                  const positionSize = collateral * leverage;
                  const entry = Number(t.openPrice) / 1e10;
                  const liq = t.liquidationPrice ? (Number(t.liquidationPrice) / 1e10) : undefined;
                  const currentTp = t.tp ? (Number(t.tp) > 0 ? Number(t.tp) / 1e10 : 0) : 0;
                  const currentSl = t.sl ? (Number(t.sl) > 0 ? Number(t.sl) / 1e10 : 0) : 0;
                  const currentPrice = getRealtimePrice(pidx);
                  const pnlData = calculatePnL({
                    ...t,
                    openPrice: Number(t.openPrice),
                    collateral: Number(t.collateral),
                    leverage: Number(t.leverage),
                    liquidationPrice: t.liquidationPrice ? Number(t.liquidationPrice) : undefined,
                    tp: t.tp ? Number(t.tp) : 0,
                    sl: t.sl ? Number(t.sl) : 0,
                  }, null, getRealtimePrice);

                  if (!editingTpSl[key]) {
                    setEditingTpSl(prev => ({
                      ...prev,
                      [key]: {
                        tp: currentTp ? String(currentTp) : '',
                        sl: currentSl ? String(currentSl) : ''
                      }
                    }));
                  }

                  const displayNetPnl = pnlData ? (pnlData.type === 'nonZeroFeePerp' ? (pnlData as any).netPnl : (pnlData as any).pnl) : undefined;
                  const displayNetPnlPercent = pnlData ? (pnlData.type === 'nonZeroFeePerp' ? (pnlData as any).netPnlPercent : (pnlData as any).pnlPercent) : undefined;

                  return (
                    <div key={key} className="bg-black/5 rounded-2xl overflow-hidden">
                      {/* Compact 2-Row Display */}
                      <div 
                        className="p-3 sm:p-4 cursor-pointer hover:bg-black/10 transition-colors"
                        onClick={() => setExpandedPosition(expandedPosition === key ? null : key)}
                      >
                        {/* Row 1: Pair Name, Direction, Current Price */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm sm:text-base font-bold text-black">{getPairName(pidx)}</h4>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${isLong ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                              {isLong ? 'Long' : 'Short'}
                            </span>
                            <span className="text-xs text-black/60">#{tidx}</span>
                          </div>
                          {currentPrice !== null && (
                            <div className="flex items-center gap-2 px-2 py-1 bg-white/50 rounded-lg">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs font-semibold text-black">
                                ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Row 2: Collateral, PnL, Close Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-xs text-black/50">Collateral</span>
                              <p className="text-sm font-semibold text-black">${collateral.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                            </div>
                            {pnlData && displayNetPnl !== undefined && displayNetPnlPercent !== undefined && (
                              <div className="flex items-center gap-2">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPnlDetailsModal({ show: true, data: pnlData });
                                  }}
                                  className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${displayNetPnl >= 0 ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}
                                >
                                  {displayNetPnl >= 0 ? '+' : ''}{displayNetPnlPercent.toFixed(2)}% (${displayNetPnl.toFixed(2)})
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPnlDetailsModal({ show: true, data: pnlData });
                                  }}
                                  className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                                  title="View PnL Details"
                                >
                                  <Eye className="w-3 h-3 text-black/60" />
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseTrade(pidx, tidx);
                            }}
                            disabled={loading}
                            className="btn-danger px-3 py-1.5 text-xs whitespace-nowrap"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedPosition === key && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-black/10 p-3 sm:p-4 bg-white/30"
                          >
                            {/* Position Details */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <InfoItem label="Position Size" value={`$${positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                              <InfoItem label="Entry Price" value={`$${entry.toLocaleString(undefined, { maximumFractionDigits: 6 })}`} />
                              <InfoItem label="Leverage" value={`${leverage.toFixed(2)}x`} />
                              {liq && <InfoItem label="Liquidation" value={`$${liq.toLocaleString(undefined, { maximumFractionDigits: 6 })}`} />}
                            </div>

                            {/* TP/SL Section */}
                            <div className="border-t border-black/10 pt-3">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-black/70">Take Profit & Stop Loss</span>
                                <button
                                  onClick={() => setShowTpSlEditor(prev => ({ ...prev, [key]: !prev[key] }))}
                                  className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                                >
                                  {showTpSlEditor[key] ? (
                                    <X className="w-4 h-4 text-black/60" />
                                  ) : (
                                    <Edit3 className="w-4 h-4 text-black/60" />
                                  )}
                                </button>
                              </div>

                              {!showTpSlEditor[key] ? (
                                // Display Mode
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-white/50 rounded-lg">
                                    <p className="text-xs text-black/50 mb-1">Take Profit</p>
                                    <p className="text-sm font-semibold text-green-700">
                                      {currentTp > 0 ? `$${currentTp.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : 'Not set'}
                                    </p>
                                  </div>
                                  <div className="p-3 bg-white/50 rounded-lg">
                                    <p className="text-xs text-black/50 mb-1">Stop Loss</p>
                                    <p className="text-sm font-semibold text-red-700">
                                      {currentSl > 0 ? `$${currentSl.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : 'Not set'}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                // Edit Mode
                                <AnimatePresence>
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3"
                                  >
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs text-black/60 mb-1.5 block">Take Profit</label>
                                        <input
                                          type="number"
                                          value={editingTpSl[key]?.tp ?? ''}
                                          onChange={(e) => setEditingTpSl(prev => ({ ...prev, [key]: { ...prev[key], tp: e.target.value } }))}
                                          className="input-field text-sm"
                                          placeholder="Enter TP"
                                          step="0.01"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-black/60 mb-1.5 block">Stop Loss</label>
                                        <input
                                          type="number"
                                          value={editingTpSl[key]?.sl ?? ''}
                                          onChange={(e) => setEditingTpSl(prev => ({ ...prev, [key]: { ...prev[key], sl: e.target.value } }))}
                                          className="input-field text-sm"
                                          placeholder="Enter SL"
                                          step="0.01"
                                        />
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const tpVal = editingTpSl[key]?.tp && editingTpSl[key]?.tp !== '' ? Math.round(Number(editingTpSl[key].tp) * 1e10) : 0;
                                        const slVal = editingTpSl[key]?.sl && editingTpSl[key]?.sl !== '' ? Math.round(Number(editingTpSl[key].sl) * 1e10) : 0;
                                        onUpdateTpSl(pidx, tidx, tpVal, slVal);
                                        setShowTpSlEditor(prev => ({ ...prev, [key]: false }));
                                      }}
                                      disabled={loading}
                                      className="btn-primary w-full flex items-center justify-center gap-2"
                                    >
                                      <Check className="w-4 h-4" />
                                      Update TP/SL
                                    </button>
                                  </motion.div>
                                </AnimatePresence>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Orders */}
          <div className="card">
            <h3 className="text-lg font-bold text-black mb-4">Pending Limit Orders ({pendingOrders.length})</h3>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-black/40">
                <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No pending orders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((o: any, i: number) => {
                  const pidx = o.pairIndex
                  const tidx = o.index
                  const orderPrice = o.price
                  const isLong = o.buy
                  const lev = o.leverage
                  const size = o.positionSize
                  const currentPrice = getRealtimePrice(pidx)
                  return (
                    <div
                      key={`${pidx}:${tidx}:${i}`}
                      className="p-3 sm:p-4 bg-black/5 rounded-2xl"
                    >
                      {/* Row 1: Pair Name, Direction, Current Price */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-black">{getPairName(pidx)}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${isLong ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                            {isLong ? 'Long' : 'Short'}
                          </span>
                          <span className="text-xs text-black/60">#{tidx}</span>
                          {lev && <span className="text-xs text-black/60">{lev}x</span>}
                        </div>
                        {currentPrice !== null && (
                          <div className="flex items-center gap-2 px-2 py-1 bg-white/50 rounded-lg">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs font-semibold text-black">
                              ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Row 2: Order Details and Cancel Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {size !== undefined && (
                            <div>
                              <span className="text-xs text-black/50">Size</span>
                              <p className="text-sm font-semibold text-black">${Number(size).toLocaleString()}</p>
                            </div>
                          )}
                          {orderPrice !== undefined && (
                            <div>
                              <span className="text-xs text-black/50">Order Price</span>
                              <p className="text-sm font-semibold text-black">${orderPrice}</p>
                            </div>
                          )}
                        </div>
                        <button className="btn-danger px-3 py-1.5 text-xs whitespace-nowrap">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}

function StatsCard({ title, value, icon, valueColor }: any) {
  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-black/60">{title}</p>
        <div className="p-2 rounded-xl bg-black text-white">
          {icon}
        </div>
      </div>
      <p className={`text-xl font-bold ${valueColor || 'text-black'}`}>{value}</p>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-black/50">{label}</p>
      <p className="font-semibold text-sm text-black">{value}</p>
    </div>
  )
}

