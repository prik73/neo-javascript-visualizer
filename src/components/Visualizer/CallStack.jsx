import { COLORS } from '../../utils/constants';
import useVisualizerStore from '../../store/visualizerStore';

export default function CallStack() {
    const callStack = useVisualizerStore((state) => state.callStack);

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Call Stack
            </h3>

            <div className="flex flex-col-reverse gap-2 min-h-[200px] p-4 bg-neutral-900/40 rounded-xl border border-neutral-800/30">
                {callStack.length === 0 ? (
                    <div className="text-neutral-600 text-xs text-center my-auto font-mono">
                        empty
                    </div>
                ) : (
                    callStack.map((item, index) => (
                        <div
                            key={`${item.name}-${index}`}
                            className="px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-200 backdrop-blur-sm animate-stackPush"
                            style={{
                                backgroundColor: COLORS.callStack + '15',
                                borderLeft: `2px solid ${COLORS.callStack}`,
                                color: COLORS.callStack,
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