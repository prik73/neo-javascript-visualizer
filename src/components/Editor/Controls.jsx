import useVisualizerStore from '../../store/visualizerStore';

export default function Controls({ onRun, onStep, onStepNext, onStepPrev, onReset }) {
    const isRunning = useVisualizerStore((state) => state.isRunning);
    const speed = useVisualizerStore((state) => state.speed);
    const setSpeed = useVisualizerStore((state) => state.setSpeed);

    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1">
                {/* Run/Pause */}
                <button
                    onClick={onRun}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-all"
                >
                    <span className="text-sm">{isRunning ? '⏸' : '▶'}</span>
                    {isRunning ? 'Pause' : 'Run'}
                </button>

                <div className="w-px h-4 bg-neutral-800 mx-2" />

                {/* Step navigation */}
                <button
                    onClick={onStepPrev}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 disabled:opacity-30 rounded transition-all"
                >
                    <span>←</span> Prev
                </button>

                <button
                    onClick={onStepNext}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 disabled:opacity-30 rounded transition-all"
                >
                    Next <span>→</span>
                </button>

                {/* Reset */}
                <button
                    onClick={onReset}
                    className="ml-1 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                >
                    Reset
                </button>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">
                    {(2100 - speed) / 1000}x
                </span>
                <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-500 hover:accent-neutral-300"
                />
            </div>
        </div>
    );
}