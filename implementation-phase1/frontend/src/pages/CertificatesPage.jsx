import { useEffect, useState } from 'react'
import {
  Award,
  CheckCircle2,
  Download,
  Flame,
  Leaf,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  TreeDeciduous,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/useAuth.js'
import { api } from '../lib/api.js'

export function CertificatesPage() {
  const { accessToken } = useAuth()
  const [stats, setStats] = useState(null)
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedCert, setSelectedCert] = useState(null)

  const fetchCertificates = async () => {
    if (!accessToken) return
    try {
      const data = await api.getCertificates(accessToken)
      setStats(data.stats)
      setCertificates(data.marketCertificates || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates()
  }, [accessToken])

  const handleIssueTestCert = async () => {
    try {
      const data = await api.issueCertificate(accessToken, {
        meterId: 'M001',
        energyAmountKwh: 35.0,
      })
      setSuccessMessage(data.message)
      fetchCertificates()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleClaim = async (certId) => {
    try {
      const data = await api.claimCertificate(accessToken, certId, 'Scope 2 ESG Decarbonization Mandate')
      setSuccessMessage(data.message)
      fetchCertificates()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#007062]">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading Carbon Offset ESG Registry…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-rise space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d8e3dc] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#007062] to-[#10b981] text-white shadow-sm shadow-[#007062]/20">
              <Leaf size={18} />
            </span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#082822]">
              Green Carbon Offset Registry
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#5a786f]">
            Verifiable renewable energy credits (0.85 kg CO₂ offset per clean kWh generated). Certified for industrial ESG compliance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleIssueTestCert}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#007062] px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#007062]/20 hover:bg-[#005c51] transition"
        >
          <Plus size={15} />
          <span>Mint Verified Green Certificate</span>
        </button>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Global ESG Statistics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc] bg-gradient-to-br from-white to-emerald-50/50">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a786f]">Total CO₂ Avoided</p>
          <p className="font-display text-3xl font-extrabold text-[#007062] mt-1">
            {stats?.totalCarbonOffsetKg || 0} <span className="text-sm font-semibold">kg</span>
          </p>
          <span className="mt-1 block text-[10px] text-emerald-800 font-semibold">
            {stats?.totalCarbonOffsetTonnes || 0} Metric Tonnes CO₂
          </span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a786f]">Trees Equivalent</p>
          <p className="font-display text-3xl font-extrabold text-emerald-800 mt-1 flex items-center gap-2">
            <TreeDeciduous size={24} className="text-emerald-600" />
            <span>{stats?.equivalentTreesPlanted || 0}</span>
          </p>
          <span className="mt-1 block text-[10px] text-[#5a786f]">Yearly absorption equivalent</span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a786f]">Clean Solar Generation</p>
          <p className="font-display text-3xl font-extrabold text-[#082822] mt-1">
            {stats?.totalSolarKwhGenerated || 0} kWh
          </p>
          <span className="mt-1 block text-[10px] text-[#5a786f]">Displaced Coal Grid Factor (0.85)</span>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-[#d8e3dc]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a786f]">Active Certificates</p>
          <p className="font-display text-3xl font-extrabold text-teal-800 mt-1">
            {stats?.activeCertificatesCount || 0}
          </p>
          <span className="mt-1 block text-[10px] text-[#5a786f]">Cryptographically Signed</span>
        </div>
      </div>

      {/* Certificates Gallery */}
      <div className="glass-panel rounded-3xl p-7 border border-[#d8e3dc] shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[#007062]" />
            <h3 className="font-display text-xl font-bold text-[#092b24]">
              Issued Carbon Offset ESG Certificates
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#007062] border border-emerald-200">
            GHG Protocol Standard
          </span>
        </div>

        {certificates.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5a786f]">
            No carbon certificates issued yet. Click "Mint Verified Green Certificate" to issue one!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="glass-card rounded-3xl p-6 border border-[#d8e3dc] shadow-md flex flex-col justify-between space-y-5 bg-gradient-to-b from-white via-white to-emerald-50/30 hover:border-[#007062]/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#d8e3dc] pb-3">
                    <span className="font-mono text-xs font-extrabold text-[#007062]">
                      {cert.certificateId}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        cert.status === 'active'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {cert.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#5a786f]">Clean Solar Energy:</span>
                      <span className="font-mono font-bold text-[#0c2b25]">{cert.energyAmountKwh} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5a786f]">Carbon Offset:</span>
                      <span className="font-mono font-extrabold text-emerald-800">{cert.carbonOffsetKg} kg CO₂</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5a786f]">Trees Equivalent:</span>
                      <span className="font-mono font-bold text-[#0c2b25]">{cert.treesEquivalent} trees</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5a786f]">Producer Meter:</span>
                      <span className="font-mono font-semibold text-[#092b24]">{cert.producerMeterId}</span>
                    </div>
                  </div>

                  {/* Digital Signature Proof */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-[10px] font-mono text-[#5a786f]">
                    <p className="font-bold text-[#0c2b25] mb-1">SHA-256 Certificate Hash:</p>
                    <p className="truncate">{cert.digitalSignature}</p>
                  </div>
                </div>

                <div className="border-t border-[#d8e3dc] pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCert(cert)}
                    className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#d8e3dc] bg-white text-xs font-bold text-[#0c2b25] hover:bg-slate-50 transition"
                  >
                    <Download size={13} />
                    <span>View Certificate</span>
                  </button>
                  {cert.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleClaim(cert.id)}
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#007062] px-3 text-xs font-bold text-white hover:bg-[#005c51] transition"
                    >
                      Claim ESG
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Viewer Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl border-4 border-emerald-600/30 space-y-6 animate-rise text-center relative">
            <button
              type="button"
              onClick={() => setSelectedCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>

            <div className="inline-flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <Award size={36} />
            </div>

            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#007062]">
                Official Renewable Energy Certificate (REC)
              </p>
              <h2 className="font-display text-2xl font-extrabold text-[#092b24] mt-1">
                Certificate of Carbon Offset
              </h2>
              <p className="font-mono text-xs text-[#5a786f] mt-1">ID: {selectedCert.certificateId}</p>
            </div>

            <div className="rounded-2xl bg-emerald-50/60 p-6 border border-emerald-200 text-xs space-y-2.5 text-left">
              <p className="text-[#4d6b61]">
                This document certifies that <span className="font-bold text-[#092b24]">{selectedCert.producerEmail}</span> (Smart Meter <span className="font-bold">{selectedCert.producerMeterId}</span>) generated <span className="font-bold text-[#007062]">{selectedCert.energyAmountKwh} kWh</span> of zero-emission rooftop solar electricity.
              </p>
              <div className="border-t border-emerald-200/80 pt-2 flex justify-between font-bold text-sm text-[#0c2b25]">
                <span>Verified Greenhouse Gas Offset:</span>
                <span className="text-emerald-800">{selectedCert.carbonOffsetKg} kg CO₂</span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#5a786f] text-left break-all">
              <p className="font-bold text-[#0c2b25]">Solana DePIN Proof:</p>
              <p>{selectedCert.solanaTxSignature}</p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full h-11 rounded-2xl bg-[#007062] text-xs font-bold text-white shadow-md hover:bg-[#005c51] transition"
            >
              Print / Save Certificate PDF
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
