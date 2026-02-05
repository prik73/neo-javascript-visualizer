import useVisualizerStore from '../../store/visualizerStore';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { COLORS } from '../../utils/constants';

export default function StatusPanel() {
    const stepDescription = useVisualizerStore((state) => state.stepDescription);
    const isRunning = useVisualizerStore((state) => state.isRunning);
    const [parent] = useAutoAnimate();

    return (
        <div className="mb-4">
            <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Status
            </h3>
            <div className="bg-neutral-900/40 rounded-xl border border-neutral-800/30 p-3 min-h-[44px] flex items-center shadow-inner relative overflow-hidden">
                <div
                    ref={parent}
                    className="text-xs font-mono text-neutral-300 relative z-10 w-full truncate"
                >
                    <span className="text-emerald-500/80 mr-2">➜</span>
                    {stepDescription}
                </div>
            </div>
        </div>
    );
}
