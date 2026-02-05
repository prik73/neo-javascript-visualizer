import { COLORS } from '../../utils/constants';
import useVisualizerStore from '../../store/visualizerStore';

export default function MicrotaskQueue() {
  const microtaskQueue = useVisualizerStore((state) => state.microtaskQueue);
  
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
        Microtask Queue
      </h3>
      
      <div className="flex gap-2 min-h-[70px] p-4 bg-neutral-900/40 rounded-xl border border-neutral-800/30 overflow-x-auto">
        {microtaskQueue.length === 0 ? (
          <div className="text-neutral-600 text-xs m-auto font-mono">empty</div>
        ) : (
          microtaskQueue.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap backdrop-blur-sm"
              style={{
                backgroundColor: COLORS.microtaskQueue + '15',
                borderTop: `2px solid ${COLORS.microtaskQueue}`,
                color: COLORS.microtaskQueue,
              }}
            >
              {item.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}