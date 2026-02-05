import { COLORS } from '../../utils/constants';
import useVisualizerStore from '../../store/visualizerStore';

export default function WebAPIs() {
  const webAPIs = useVisualizerStore((state) => state.webAPIs);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
        Web APIs
      </h3>

      <div className="grid grid-cols-2 gap-2 min-h-[200px] p-4 bg-neutral-900/40 rounded-xl border border-neutral-800/30">
        {webAPIs.length === 0 ? (
          <div className="col-span-2 text-neutral-600 text-xs text-center m-auto font-mono">
            no active apis
          </div>
        ) : (
          webAPIs.map((item) => (
            <div
              key={item.id}
              className="px-3 py-2.5 rounded-lg text-xs font-mono backdrop-blur-sm relative overflow-hidden"
              style={{
                backgroundColor: COLORS.webAPIs + '15',
                border: `1px solid ${COLORS.webAPIs}40`,
              }}
            >
              {/* Animated timer indicator */}
              {item.type === 'setTimeout' && (
                <div className="absolute top-2 right-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke={COLORS.webAPIs}
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill={COLORS.webAPIs}
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}

              <div className="font-semibold" style={{ color: COLORS.webAPIs }}>{item.type}</div>
              <div className="text-neutral-500 mt-1 text-[10px]">
                {item.delay ? `${item.delay}ms` : 'pending...'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}