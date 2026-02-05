// Minimal, modern color scheme
export const COLORS = {
  callStack: '#A78BFA',      // Softer purple
  taskQueue: '#60A5FA',      // Softer blue
  microtaskQueue: '#34D399', // Softer green
  rafQueue: '#FBBF24',       // Softer amber
  webAPIs: '#F472B6',        // Softer pink
  eventLoop: '#818CF8',      // Softer indigo
  console: '#111827',        // Very dark gray
  background: '#FAFAFA',     // Off-white (light mode!)
  backgroundDark: '#0A0A0A', // True black for dark mode
  card: '#FFFFFF',           // Pure white cards
  cardDark: '#1A1A1A',       // Dark cards
  border: '#E5E7EB',         // Light border
  borderDark: '#2A2A2A',     // Dark border
  text: '#111827',           // Dark text
  textDark: '#F9FAFB',       // Light text
  textMuted: '#6B7280',      // Muted text
  textMutedDark: '#9CA3AF',  // Muted text dark
};

// Execution timing (in ms)
export const TIMING = {
  minSpeed: 100,
  maxSpeed: 2000,
  defaultSpeed: 500,
  stepDelay: 50,
};

// Queue item types
export const ITEM_TYPES = {
  FUNCTION_CALL: 'function_call',
  TIMEOUT: 'timeout',
  INTERVAL: 'interval',
  PROMISE: 'promise',
  RAF: 'raf',
  FETCH: 'fetch',
};

// Event loop phases
export const LOOP_PHASES = {
  CHECK_STACK: 'check_stack',
  RUN_MICROTASKS: 'run_microtasks',
  RENDER: 'render',
  RUN_TASK: 'run_task',
};