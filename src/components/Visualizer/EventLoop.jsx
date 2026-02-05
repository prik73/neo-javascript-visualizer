import { useState, useEffect, useRef } from 'react';
import { COLORS, LOOP_PHASES } from '../../utils/constants';
import useVisualizerStore from '../../store/visualizerStore';

export default function EventLoop() {
    const currentPhase = useVisualizerStore((state) => state.currentPhase);
    const isRunning = useVisualizerStore((state) => state.isRunning);
    const [advancedMode, setAdvancedMode] = useState(false);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const rotationRef = useRef(0);

    const phases = [
        { id: LOOP_PHASES.CHECK_STACK, label: 'Check Stack' },
        { id: LOOP_PHASES.RUN_MICROTASKS, label: 'Microtasks' },
        { id: LOOP_PHASES.RENDER, label: 'Render' },
        { id: LOOP_PHASES.RUN_TASK, label: 'Task' },
    ];

    // Canvas drawing function
    useEffect(() => {
        if (!advancedMode || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;
        const centerX = width / 2;
        const centerY = height / 2;

        const draw = () => {
            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Draw outer loop ellipse
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, 150, 80, 0, 0, Math.PI * 2);
            ctx.strokeStyle = COLORS.eventLoop + '20';
            ctx.lineWidth = 40;
            ctx.stroke();

            // Draw center circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.backgroundDark;
            ctx.fill();
            ctx.strokeStyle = COLORS.eventLoop + '30';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw center text
            ctx.fillStyle = COLORS.textMutedDark;
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('event loop', centerX, centerY);

            // Draw task queue (left)
            const taskX = 40;
            const taskY = centerY - 20;
            ctx.fillStyle = COLORS.taskQueue + '30';
            ctx.strokeStyle = COLORS.taskQueue;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(taskX, taskY, 40, 40, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = COLORS.taskQueue;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('T', taskX + 20, taskY + 22);

            // Draw render steps (right)
            const renderX = width - 60;
            const renderY = centerY - 40;

            // Render steps background
            ctx.strokeStyle = COLORS.rafQueue + '40';
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.moveTo(renderX, renderY);
            ctx.lineTo(renderX + 40, renderY);
            ctx.lineTo(renderX + 40, renderY + 80);
            ctx.lineTo(renderX, renderY + 80);
            ctx.stroke();

            // Render step labels
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';

            ctx.fillStyle = COLORS.rafQueue;
            ctx.fillText('S', renderX + 20, renderY + 15);

            ctx.fillStyle = COLORS.eventLoop;
            ctx.fillText('L', renderX + 20, renderY + 40);

            ctx.fillStyle = COLORS.microtaskQueue;
            ctx.fillText('P', renderX + 20, renderY + 65);

            // Draw rotating indicator if running
            if (isRunning) {
                rotationRef.current += 0.02;
                const angle = rotationRef.current;
                const indicatorX = centerX + Math.cos(angle - Math.PI / 2) * 150;
                const indicatorY = centerY + Math.sin(angle - Math.PI / 2) * 80;

                // Indicator dot
                ctx.beginPath();
                ctx.arc(indicatorX, indicatorY, 6, 0, Math.PI * 2);
                ctx.fillStyle = COLORS.eventLoop;
                ctx.fill();

                // Indicator line
                ctx.beginPath();
                ctx.moveTo(indicatorX, indicatorY);
                ctx.lineTo(
                    indicatorX + Math.cos(angle - Math.PI / 2) * 15,
                    indicatorY + Math.sin(angle - Math.PI / 2) * 15
                );
                ctx.strokeStyle = COLORS.eventLoop;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Continue animation
            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [advancedMode, isRunning]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Event Loop
                </h3>

                <button
                    onClick={() => setAdvancedMode(!advancedMode)}
                    className="px-2.5 py-1 bg-neutral-800/30 hover:bg-neutral-800/50 text-neutral-400 text-[10px] rounded-lg transition-colors font-mono"
                >
                    {advancedMode ? 'simple' : 'advanced'}
                </button>
            </div>

            {advancedMode ? (
                // Canvas-based Circular Loop
                <div className="relative p-8 bg-neutral-900/40 rounded-xl border border-neutral-800/30 min-h-[200px] flex items-center justify-center">
                    <canvas
                        ref={canvasRef}
                        className="w-full max-w-[500px] aspect-[2/1]"
                        style={{ imageRendering: 'crisp-edges' }}
                    />

                    {/* Labels */}
                    <div className="absolute top-4 left-4 text-[9px] text-neutral-500 font-mono">
                        task queue
                    </div>
                    <div className="absolute top-4 right-4 text-[9px] text-neutral-500 font-mono">
                        render steps
                    </div>
                </div>
            ) : (
                // Simple Mode - Phase Indicators
                <div className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-800/30">
                    <div className="flex items-center justify-center gap-2">
                        {phases.map((phase, index) => (
                            <div key={phase.id} className="flex items-center">
                                <div
                                    className={`px-3 py-2 rounded-lg text-[10px] font-mono transition-all duration-200 ${currentPhase === phase.id
                                        ? 'ring-1 ring-offset-1 ring-offset-neutral-900'
                                        : 'opacity-40'
                                        }`}
                                    style={{
                                        backgroundColor: currentPhase === phase.id
                                            ? COLORS.eventLoop + '30'
                                            : COLORS.eventLoop + '10',
                                        color: currentPhase === phase.id ? COLORS.eventLoop : COLORS.textMutedDark,
                                        ringColor: COLORS.eventLoop,
                                    }}
                                >
                                    {phase.label}
                                </div>

                                {index < phases.length - 1 && (
                                    <div className="mx-1.5 text-neutral-700 text-xs">→</div>
                                )}
                            </div>
                        ))}
                    </div>

                    {isRunning && (
                        <div className="mt-3 text-center">
                            <div className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full animate-pulse font-mono">
                                ● running
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}