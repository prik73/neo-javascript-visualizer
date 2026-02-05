import { useEffect, useState, useRef } from 'react';
import CodeEditor from './components/Editor/CodeEditor.jsx';
import Controls from './components/Editor/Controls.jsx';
import CallStack from './components/Visualizer/CallStack.jsx';
import TaskQueue from './components/Visualizer/TaskQueue.jsx';
import MicrotaskQueue from './components/Visualizer/MicrotaskQueue.jsx';
import RAFQueue from './components/Visualizer/RAFQueue.jsx';
import WebAPIs from './components/Visualizer/WebAPIs.jsx';
import EventLoop from './components/Visualizer/EventLoop.jsx';
import Console from './components/Visualizer/Console.jsx';
import useVisualizerStore from './store/visualizerStore.js';
import { presets } from './engine/presets.js';
import executor from './engine/executor.js';
import { installInterceptors, restoreOriginalAPIs } from './engine/interceptor.js';
import './App.css';

function App() {
  const setCurrentCode = useVisualizerStore((state) => state.setCurrentCode);
  const reset = useVisualizerStore((state) => state.reset);
  const speed = useVisualizerStore((state) => state.speed);
  const currentCode = useVisualizerStore((state) => state.currentCode);
  const [selectedPreset, setSelectedPreset] = useState(presets[0].id);
  const [editorWidth, setEditorWidth] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Install Web API interceptors on mount
  useEffect(() => {
    installInterceptors(useVisualizerStore.getState());
    return () => restoreOriginalAPIs();
  }, []);

  useEffect(() => {
    setCurrentCode(presets[0].code);
  }, [setCurrentCode]);

  const handlePresetChange = (e) => {
    const preset = presets.find(p => p.id === e.target.value);
    if (preset) {
      reset();
      setCurrentCode(preset.code);
      setSelectedPreset(preset.id);
    }
  };

  const handleRun = () => {
    // Reset state before running new code
    executor.reset();
    reset();

    const result = executor.generateSteps(currentCode);

    if (result.success) {
      executor.executeAll(speed);
    } else {
      console.error('Parse error:', result.error);
      useVisualizerStore.getState().addToConsole(`Error: ${result.error}`);
    }
  };

  const handleStep = () => {
    if (executor.steps.length === 0) {
      // Reset state before starting new execution
      executor.reset();
      reset();

      const result = executor.generateSteps(currentCode);
      if (!result.success) {
        console.error('Parse error:', result.error);
        useVisualizerStore.getState().addToConsole(`Error: ${result.error}`);
        return;
      }
    }

    executor.executeNextStep();
  };

  const handleStepNext = async () => {
    if (executor.steps.length === 0) {
      // Reset state before starting new execution
      executor.reset();
      reset();

      // Generate steps first
      const result = executor.generateSteps(currentCode);
      if (!result.success) {
        useVisualizerStore.getState().addToConsole(`Error: ${result.error}`);
        return;
      }
    }

    // Execute next step and wait for it to complete
    await executor.executeNextStep();
  };

  const handleStepPrev = () => {
    // Move micro-step back (doesn't undo state)
    if (executor.microSteps.length > 0) {
      if (executor.currentMicroStep > 0) {
        executor.currentMicroStep--;
        const prevMicroStep = executor.microSteps[executor.currentMicroStep];
        if (prevMicroStep && prevMicroStep.line) {
          useVisualizerStore.getState().setCurrentLine(prevMicroStep.line);
        }
      }
    } else {
      // Fallback to old steps
      if (executor.currentStep > 0) {
        executor.currentStep--;
        const prevStep = executor.steps[executor.currentStep - 1];
        if (prevStep && prevStep.line) {
          useVisualizerStore.getState().setCurrentLine(prevStep.line);
        }
      }
    }
  };

  const handleReset = () => {
    executor.reset();
    reset();
    const preset = presets.find(p => p.id === selectedPreset);
    if (preset) {
      setCurrentCode(preset.code);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedWidth = Math.min(Math.max(newWidth, 20), 40);
      setEditorWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="h-screen flex flex-col bg-neutral-950">
      {/* Minimal Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-medium text-neutral-400 tracking-tight">
            Event Loop Visualizer
          </h1>

          <select
            value={selectedPreset}
            onChange={handlePresetChange}
            className="px-2 py-1 bg-neutral-800/50 text-neutral-400 text-xs rounded border border-neutral-700/50 focus:border-neutral-600 focus:outline-none hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.title}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left Side: Code Editor + Console */}
        <div
          className="flex flex-col border-r border-neutral-800/50"
          style={{ width: `${editorWidth}%` }}
        >
          {/* Controls Bar */}
          <div className="flex-none px-4 py-2 bg-neutral-900/30 border-b border-neutral-800/30">
            <Controls
              onRun={handleRun}
              onStep={handleStep}
              onStepNext={handleStepNext}
              onStepPrev={handleStepPrev}
              onReset={handleReset}
            />
          </div>

          {/* Code Editor - Takes remaining space */}
          <div className="flex-1 min-h-0">
            <CodeEditor />
          </div>

          {/* Console - Fixed height or percentage */}
          <div className="h-[40%] border-t border-neutral-800/50 bg-neutral-950">
            <Console />
          </div>
        </div>

        {/* Resizer */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-px bg-neutral-800/50 hover:bg-blue-500/50 cursor-col-resize transition-all relative group ${isDragging ? 'bg-blue-500' : ''
            }`}
        >
          <div className="absolute inset-y-0 -left-2 -right-2" />
        </div>

        {/* Right Side: Visualizer */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-4">
          {/* Event Loop - Now has much more space */}
          <EventLoop />

          <div className="grid grid-cols-2 gap-6">
            <CallStack />
            <WebAPIs />
          </div>

          <MicrotaskQueue />
          <TaskQueue />
          <RAFQueue />
        </div>
      </div>
    </div>
  );
}

export default App;