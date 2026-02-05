import { COLORS } from '../../utils/constants';
import useVisualizerStore from '../../store/visualizerStore';

export default function TaskQueue() {
    const taskQueue = useVisualizerStore((state) => state.taskQueue);

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Task Queue
            </h3>

            <div
                className="flex gap-2 min-h-[70px] p-4 bg-neutral-900/40 rounded-xl border border-neutral-800/30 overflow-x-auto relative"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)'
                }}
            >
                {taskQueue.length === 0 ? (
                    <div className="text-neutral-600 text-xs m-auto font-mono">empty</div>
                ) : (
                    taskQueue.map((item, index) => (
                        <div
                            key={`${item.name}-${index}`}
                            className="px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap backdrop-blur-sm animate-queueSlideIn"
                            style={{
                                backgroundColor: COLORS.taskQueue + '15',
                                borderTop: `2px solid ${COLORS.taskQueue}`,
                                color: COLORS.taskQueue,
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