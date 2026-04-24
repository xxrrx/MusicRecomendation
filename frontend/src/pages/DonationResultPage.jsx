import { useSearchParams, useNavigate } from 'react-router-dom';

export default function DonationResultPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status');
  const message = params.get('message');
  const donationId = params.get('donationId');

  const isSuccess = status === 'success';

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0a0a] text-white flex flex-col md:flex-row">

      {/* ── Cột trái: Visual trạng thái ─────────────────────────── */}
      <div className={`relative md:w-1/2 flex flex-col items-center justify-center gap-6 p-10 min-h-[260px] md:min-h-0 overflow-hidden`}>
        {/* Background glow */}
        <div className={`absolute inset-0 ${
          isSuccess
            ? 'bg-gradient-to-br from-[#1DB954]/20 via-[#0a0a0a] to-[#0a0a0a]'
            : 'bg-gradient-to-br from-red-600/20 via-[#0a0a0a] to-[#0a0a0a]'
        }`} />
        <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          isSuccess ? 'bg-[#1DB954]' : 'bg-red-500'
        }`} />

        {/* Nội dung */}
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl font-black border-4 ${
            isSuccess
              ? 'bg-[#1DB954]/20 border-[#1DB954] text-[#1DB954]'
              : 'bg-red-500/20 border-red-500 text-red-400'
          }`}>
            {isSuccess ? '✓' : '✕'}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              {isSuccess ? 'Thành công!' : 'Thất bại'}
            </h1>
            <p className={`text-sm mt-2 ${isSuccess ? 'text-[#1DB954]' : 'text-red-400'}`}>
              {isSuccess ? 'Giao dịch đã được xác nhận' : 'Giao dịch không hoàn tất'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Cột phải: Chi tiết & hành động ─────────────────────── */}
      <div className="md:w-1/2 flex flex-col justify-center px-8 py-10 md:px-14 md:py-12 bg-[#0a0a0a] gap-7 border-t border-[#2a2a2a] md:border-t-0 md:border-l">
        <div>
          <h2 className="text-2xl font-bold">Chi tiết giao dịch</h2>
          <p className="text-[#b3b3b3] text-sm mt-1">
            {isSuccess ? 'Cảm ơn bạn đã ủng hộ nghệ sĩ!' : 'Vui lòng kiểm tra lại và thử lại.'}
          </p>
        </div>

        <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#b3b3b3]">Trạng thái</span>
            <span className={`font-bold ${isSuccess ? 'text-[#1DB954]' : 'text-red-400'}`}>
              {isSuccess ? 'Thành công' : 'Thất bại'}
            </span>
          </div>
          {donationId && (
            <div className="flex justify-between text-sm items-center">
              <span className="text-[#b3b3b3]">Mã giao dịch</span>
              <span className="font-mono text-xs text-[#b3b3b3] bg-[#282828] px-2 py-1 rounded">{donationId}</span>
            </div>
          )}
          {!isSuccess && message && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-300 text-sm leading-relaxed">
              {message}
            </div>
          )}
          {isSuccess && (
            <div className="bg-[#1DB954]/10 border border-[#1DB954]/30 rounded-xl px-4 py-3 text-[#1DB954] text-sm leading-relaxed">
              Khoản donate của bạn đã được ghi nhận và chuyển đến nghệ sĩ.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-xl transition text-sm"
          >
            Về trang chủ
          </button>
          {!isSuccess && (
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3.5 bg-[#181818] hover:bg-[#282828] text-white font-semibold rounded-xl transition text-sm"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
