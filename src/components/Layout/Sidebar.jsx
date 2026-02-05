import { presets } from '../../engine/presets';
import useVisualizerStore from '../../store/visualizerStore';

export default function Sidebar() {
    const setCurrentCode = useVisualizerStore((state) => state.setCurrentCode);
    const reset = useVisualizerStore((state) => state.reset);

    const loadPreset = (preset) => {
        reset();
        setCurrentCode(preset.code);
    };

    return (
        <aside className="w-80 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4">
                Example Scenarios
            </h2>

            <div className="space-y-3">
                {presets.map((preset) => (
                    <button
                        key={preset.id}
                        onClick={() => loadPreset(preset)}
                        className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors group"
                    >
                        <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                            {preset.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {preset.description}
                        </p>
                    </button>
                ))}
            </div>
        </aside>
    );
}