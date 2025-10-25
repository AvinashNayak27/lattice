import { motion } from 'framer-motion'
import { Users, TrendingUp, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useAccount } from 'wagmi'

export default function Profile() {
  const { address } = useAccount()
  const [copied, setCopied] = useState(false)

  // Mock Farcaster data
  const userData = {
    fid: 265504,
    displayName: "Avinash",
    profile: {
      bio: {
        text: "Full-stack developer exploring onchain prev-@reclaimprotocol @basecolors",
        mentions: ["reclaimprotocol", "basecolors"],
        channelMentions: []
      },
      location: {
        placeId: "",
        description: ""
      },
      earlyWalletAdopter: true,
      url: "https://bento.me/avinashnayak"
    },
    followerCount: 149,
    followingCount: 233,
    username: "avinashnayak",
    pfp: {
      url: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/36d93bb3-f4e0-4ca6-739d-5b6639304f00/rectcrop3",
      verified: false
    }
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src={userData.pfp.url}
              alt={userData.displayName}
              className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-black/10 object-cover"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-black mb-1">{userData.displayName}</h2>
                <p className="text-sm text-black/50">@{userData.username}</p>
                {userData.profile.earlyWalletAdopter && (
                  <span className="inline-block mt-2 px-3 py-1 bg-purple-500/10 text-purple-600 text-xs font-semibold rounded-full">
                    Early Adopter ⭐
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://warpcast.com/${userData.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-all flex items-center gap-2"
                >
                  Farcaster <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-black/70 mb-4 leading-relaxed">
              {userData.profile.bio.text}
            </p>

            {/* Links */}
            {userData.profile.url && (
              <a
                href={userData.profile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-black hover:text-black/70 transition-colors inline-flex items-center gap-1 mb-4"
              >
                {userData.profile.url} <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-black/10">
              <div>
                <p className="text-xl font-bold text-black">{userData.followerCount}</p>
                <p className="text-xs text-black/50">Followers</p>
              </div>
              <div>
                <p className="text-xl font-bold text-black">{userData.followingCount}</p>
                <p className="text-xs text-black/50">Following</p>
              </div>
              <div>
                <p className="text-xl font-bold text-black">{userData.fid}</p>
                <p className="text-xs text-black/50">FID</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Info */}
      {address && (
        <div className="card">
          <h3 className="text-lg font-bold text-black mb-4">Connected Wallet</h3>
          <div className="p-4 bg-black/5 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-black/50 mb-1">Address</p>
                <p className="font-mono text-sm text-black">{formatAddress(address)}</p>
              </div>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-black/10 rounded-xl transition-all"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-black/70" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trading Stats */}
      <div className="card">
        <h3 className="text-lg font-bold text-black mb-4">Trading Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem label="Total Trades" value="0" />
          <StatItem label="Win Rate" value="0%" />
          <StatItem label="Total Volume" value="$0" />
          <StatItem label="Best Trade" value="$0" />
        </div>
      </div>

      {/* Social Graph Preview */}
      <div className="card">
        <h3 className="text-lg font-bold text-black mb-4">Your Lattice</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-black/30" />
          </div>
          <p className="text-sm text-black/50 mb-2">No trades yet</p>
          <p className="text-xs text-black/40">
            Your trading network will appear here once you open your first position
          </p>
        </div>
      </div>

      {/* About Lattice */}
      <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <h3 className="text-lg font-bold text-black mb-3">About Lattice</h3>
        <p className="text-sm text-black/70 mb-4 leading-relaxed">
          Lattice transforms your trading activity into a visible social graph on Farcaster. 
          Every trade you make becomes a node in your network, building your reputation as a trader.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-semibold text-black/70">
            Social Trading
          </span>
          <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-semibold text-black/70">
            On-chain Reputation
          </span>
          <span className="px-3 py-1 bg-white/60 rounded-full text-xs font-semibold text-black/70">
            Network Effects
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-black/5 rounded-2xl">
      <p className="text-xs text-black/50 mb-1">{label}</p>
      <p className="text-lg font-bold text-black">{value}</p>
    </div>
  )
}

