import { create } from "zustand";

export const useVisualizerStore = create((set) => ({
    // Execution state
    isRunning: false,
    isPaused: false,
    speed: 500, // ms per step
    currentStep: 0,

    // Queues and stacks
    callStack: [],
    taskQueue: [],
    microtaskQueue: [],
    rafQueue: [],
    webAPIs: [],
    consoleOutput: [],

    // Event loop state
    currentPhase: null,
    isLooping: false,

    // Code
    currentCode: '',
    currentLine: null,
    stepDescription: 'Ready',

    // Actions
    setStepDescription: (desc) => set({ stepDescription: desc }),
    setIsRunning: (isRunning) => set({ isRunning }),
    setRunning: (isRunning) => set({ isRunning }),
    setPaused: (isPaused) => set({ isPaused }),
    setSpeed: (speed) => set({ speed }),

    pushToCallStack: (item) => set((state) => ({
        callStack: [...state.callStack, item]
    })),

    popFromCallStack: () => set((state) => ({
        callStack: state.callStack.slice(0, -1)
    })),

    addToTaskQueue: (item) => set((state) => ({
        taskQueue: [...state.taskQueue, item]
    })),

    removeFromTaskQueue: (id) => set((state) => ({
        taskQueue: id ? state.taskQueue.filter(task => task.id !== id) : state.taskQueue.slice(1)
    })),

    addToMicrotaskQueue: (item) => set((state) => ({
        microtaskQueue: [...state.microtaskQueue, item]
    })),

    removeFromMicrotaskQueue: () => set((state) => ({
        microtaskQueue: state.microtaskQueue.slice(1)
    })),

    addToRAFQueue: (item) => set((state) => ({
        rafQueue: [...state.rafQueue, item]
    })),

    removeFromRAFQueue: (id) => set((state) => ({
        rafQueue: id ? state.rafQueue.filter(raf => raf.id !== id) : state.rafQueue.slice(1)
    })),

    addToWebAPIs: (item) => set((state) => ({
        webAPIs: [...state.webAPIs, item]
    })),

    removeFromWebAPIs: (id) => set((state) => ({
        webAPIs: state.webAPIs.filter(api => api.id !== id)
    })),

    addToConsole: (message) => set((state) => ({
        consoleOutput: [...state.consoleOutput, typeof message === 'string' ? { message } : message]
    })),

    setCurrentPhase: (phase) => set({ currentPhase: phase }),

    setCurrentCode: (code) => set({ currentCode: code }),

    setCurrentLine: (line) => set({ currentLine: line }),

    reset: () => set({
        callStack: [],
        taskQueue: [],
        microtaskQueue: [],
        rafQueue: [],
        webAPIs: [],
        consoleOutput: [],
        currentStep: 0,
        currentPhase: null,
        currentLine: null,
        isRunning: false,
        isPaused: false,
        stepDescription: 'Ready',
    }),
}));


export default useVisualizerStore;