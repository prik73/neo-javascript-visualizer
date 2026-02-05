import { useState, useEffect } from 'react';
import useVisualizerStore from '../../store/visualizerStore';

export default function CodeEditor() {
    const currentCode = useVisualizerStore((state) => state.currentCode);
    const setCurrentCode = useVisualizerStore((state) => state.setCurrentCode);
    const currentLine = useVisualizerStore((state) => state.currentLine);

    const [localCode, setLocalCode] = useState(currentCode);

    useEffect(() => {
        setLocalCode(currentCode);
    }, [currentCode]);

    const handleChange = (e) => {
        const newCode = e.target.value;
        setLocalCode(newCode);
        setCurrentCode(newCode);
    };

    const lines = localCode.split('\n');

    return (
        <div className="h-full flex flex-col p-4">
            <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-2">
                Code
            </h3>

            <div className="flex-1 flex gap-2 bg-neutral-900/40 rounded-xl border border-neutral-800/30 p-4 overflow-auto">
                {/* Line numbers + arrows */}
                <div className="flex flex-col font-mono text-sm text-neutral-600 select-none">
                    {lines.map((_, index) => (
                        <div key={index} className="h-6 flex items-center justify-end pr-3 min-w-[40px]">
                            {currentLine === index + 1 && (
                                <span className="text-yellow-400 mr-2">→</span>
                            )}
                            <span className={currentLine === index + 1 ? 'text-yellow-400 font-bold' : ''}>
                                {index + 1}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Code content */}
                <div className="flex-1 relative">
                    <textarea
                        value={localCode}
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full bg-transparent text-neutral-200 font-mono text-sm resize-none focus:outline-none leading-6 overflow-hidden"
                        placeholder="Write your JavaScript code here..."
                        spellCheck={false}
                        style={{
                            caretColor: '#e5e5e5',
                            lineHeight: '1.5rem', // 24px to match line numbers
                        }}
                    />

                    {/* Highlight overlay */}
                    <div className="absolute inset-0 pointer-events-none font-mono text-sm leading-6">
                        {lines.map((line, index) => (
                            <div
                                key={index}
                                className={`h-6 ${currentLine === index + 1
                                    ? 'bg-yellow-400/10 border-l-2 border-yellow-400'
                                    : ''
                                    }`}
                            >
                                <span className="opacity-0">{line || ' '}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}