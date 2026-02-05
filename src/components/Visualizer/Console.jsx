import { useRef, useEffect } from 'react';
import useVisualizerStore from '../../store/visualizerStore';

export default function Console() {
    const consoleOutput = useVisualizerStore((state) => state.consoleOutput);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [consoleOutput]);

    return (
        <div className="h-full flex flex-col p-4">
            <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2 flex-none">
                Console Output
            </h3>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto bg-neutral-900/40 rounded-xl border border-neutral-800/30 p-3 font-mono text-xs"
            >
                {consoleOutput.length === 0 ? (
                    <div className="text-neutral-600 text-[11px] italic">no output yet...</div>
                ) : (
                    consoleOutput.map((log, index) => (
                        <div
                            key={index}
                            className={`py-0.5 animate-consoleAppear flex items-start ${log.type === 'error' ? 'text-red-400' :
                                    log.type === 'warn' ? 'text-amber-400' : 'text-neutral-300'
                                }`}
                        >
                            <span className="text-neutral-600 mr-2 select-none flex-none">›</span>
                            <span className="break-all whitespace-pre-wrap">
                                {typeof log.message === 'object'
                                    ? JSON.stringify(log.message, null, 2)
                                    : String(log.message || '')}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}