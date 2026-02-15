#!/usr/bin/env node
/**
 * Orion Status Bridge
 * 
 * Connects to Clawdbot Gateway WebSocket and updates status.json
 * based on agent activity events.
 * 
 * Usage: node status-bridge.js
 * 
 * Requires: CLAWDBOT_GATEWAY_TOKEN environment variable or token in config
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const GATEWAY_URL = 'ws://127.0.0.1:18789';
const STATUS_FILE = path.join(__dirname, 'data', 'status.json');
const STATUS_FILE_V2 = '/Users/Orion/Documents/projects/command-center-v2/data/status.json';
const RECONNECT_DELAY = 5000;

// Get token from environment or config
function getGatewayToken() {
  // Try environment variable first (new name)
  if (process.env.OPENCLAW_GATEWAY_TOKEN) {
    return process.env.OPENCLAW_GATEWAY_TOKEN;
  }
  // Legacy env var
  if (process.env.CLAWDBOT_GATEWAY_TOKEN) {
    return process.env.CLAWDBOT_GATEWAY_TOKEN;
  }
  
  // Try reading from OpenClaw config (new location)
  try {
    const configPath = path.join(process.env.HOME, '.openclaw', 'openclaw.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.gateway?.auth?.token) {
      return config.gateway.auth.token;
    }
  } catch (e) {
    // Fall through to legacy
  }
  
  // Try legacy Clawdbot config
  try {
    const configPath = path.join(process.env.HOME, '.clawdbot', 'clawdbot.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.gateway?.auth?.token;
  } catch (e) {
    console.error('Could not find gateway token');
    return null;
  }
}

// State tracking
let currentState = 'idle';
let activityLog = [];
let subAgents = [];

// File to track sub-agents (Orion writes here, bridge reads it)
const SUBAGENTS_FILE = path.join(__dirname, 'src', 'subagents.json');

// File for manual alert override (Orion writes here to trigger Alert)
const ALERT_FILE = path.join(__dirname, 'src', 'alert.json');

// Update status.json
function updateStatus(state, task = null, description = null) {
  const timestamp = new Date().toISOString();
  
  if (state !== currentState) {
    activityLog.unshift({
      time: timestamp,
      action: `State → ${state}${task ? ` (${task})` : ''}`
    });
    activityLog = activityLog.slice(0, 10); // Keep last 10
    currentState = state;
  }
  
  // Read sub-agents from separate file (Orion manages this)
  let currentSubAgents = [];
  try {
    if (fs.existsSync(SUBAGENTS_FILE)) {
      currentSubAgents = JSON.parse(fs.readFileSync(SUBAGENTS_FILE, 'utf8'));
    }
  } catch (e) {
    // Ignore read errors
  }
  
  // Check for alert override (Orion can write alert.json to force Alert state)
  let alertOverride = null;
  try {
    if (fs.existsSync(ALERT_FILE)) {
      alertOverride = JSON.parse(fs.readFileSync(ALERT_FILE, 'utf8'));
      if (alertOverride && alertOverride.active) {
        state = 'alert';
        task = alertOverride.task || 'Attention needed';
        description = alertOverride.description || 'Needs your attention!';
        console.log(`🚨 Alert override active: ${task}`);
      }
    }
  } catch (e) {
    // Ignore read errors
  }
  
  const status = {
    state: state,
    stateDescription: description || getDefaultDescription(state),
    currentTask: task,
    stateStartTime: timestamp,
    activityLog: activityLog,
    subAgents: currentSubAgents
  };
  
  const json = JSON.stringify(status, null, 2);
  fs.writeFileSync(STATUS_FILE, json);
  try { fs.writeFileSync(STATUS_FILE_V2, json); } catch (e) { /* V2 path may not exist */ }
  console.log(`[${new Date().toLocaleTimeString()}] Status: ${state}${task ? ` - ${task}` : ''}${currentSubAgents.length ? ` [${currentSubAgents.length} sub-agents]` : ''}`);
}

function getDefaultDescription(state) {
  const descriptions = {
    idle: 'Waiting for input',
    thinking: 'Planning and deciding',
    working: 'Executing tasks',
    coding: 'Writing code',
    reading: 'Ingesting information',
    alert: 'Attention needed'
  };
  return descriptions[state] || 'Unknown state';
}

// Determine state from event
function getStateFromEvent(event, payload) {
  // Agent lifecycle events
  if (event === 'agent') {
    const stream = payload?.stream;
    const data = payload?.data;
    
    if (stream === 'lifecycle') {
      if (data?.phase === 'start') {
        return { state: 'thinking', task: 'Processing request', desc: 'Starting to think...' };
      }
      if (data?.phase === 'end') {
        return { state: 'idle', task: null, desc: 'Waiting for input' };
      }
    }
    
    if (stream === 'assistant') {
      // I'm generating text - show as working
      const text = truncate(data?.text, 40);
      return { state: 'working', task: text, desc: 'Generating response' };
    }
    
    if (stream === 'tool_call') {
      // Tool being called
      return { state: 'coding', task: data?.name || 'Running tool', desc: 'Executing tool' };
    }
    
    if (stream === 'tool_result') {
      return { state: 'reading', task: 'Processing result', desc: 'Reading tool output' };
    }
  }
  
  // Exec approval events - catch various formats OpenClaw might use
  if (event === 'exec.approval.requested' || 
      event === 'exec.approval' || 
      event === 'approval.requested' ||
      (event === 'exec' && payload?.status === 'pending')) {
    const cmd = payload?.command || payload?.cmd || 'command';
    const shortCmd = truncate(cmd, 30);
    return { state: 'alert', task: `Approval: ${shortCmd}`, desc: 'Command needs approval' };
  }
  
  // Approval resolved - clear alert
  if (event === 'exec.approval.resolved' ||
      event === 'exec.approved' ||
      event === 'exec.denied' ||
      event === 'approval.resolved' ||
      (event === 'exec' && (payload?.status === 'approved' || payload?.status === 'denied' || payload?.status === 'running'))) {
    return { state: 'working', task: 'Approved - executing', desc: 'Running command' };
  }
  
  // Exec finished
  if (event === 'exec.finished' || event === 'exec.done' ||
      (event === 'exec' && payload?.status === 'finished')) {
    return { state: 'idle', task: null, desc: 'Command complete' };
  }
  
  return null;
}

function truncate(str, len) {
  if (!str) return null;
  return str.length > len ? str.substring(0, len) + '...' : str;
}

// Catch unhandled errors so Node doesn't crash
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (will retry):', err.message);
});

// Connect to Gateway
function connect() {
  const token = getGatewayToken();
  if (!token) {
    console.error('No gateway token found. Set CLAWDBOT_GATEWAY_TOKEN or check config.');
    process.exit(1);
  }
  
  console.log(`Connecting to ${GATEWAY_URL}...`);
  
  let ws;
  try {
    ws = new WebSocket(GATEWAY_URL);
  } catch (err) {
    console.error('WebSocket creation failed:', err.message);
    console.log(`Retrying in ${RECONNECT_DELAY/1000}s...`);
    setTimeout(connect, RECONNECT_DELAY);
    return;
  }
  
  ws.on('open', () => {
    console.log('Connected! Sending handshake...');
    
    // Send connect request (use 'cli' as client id - it's in the allowed list)
    const connectReq = {
      type: 'req',
      id: 'connect-1',
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'cli',
          version: '1.0.0',
          platform: process.platform === 'darwin' ? 'macos' : process.platform,
          mode: 'cli'
        },
        role: 'operator',
        scopes: ['operator.read'],
        caps: [],
        commands: [],
        permissions: {},
        auth: { token: token },
        locale: 'en-US',
        userAgent: 'clawdbot-cli/1.0.0'
      }
    };
    
    ws.send(JSON.stringify(connectReq));
  });
  
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      // Handle connect response
      if (msg.type === 'res' && msg.id === 'connect-1') {
        if (msg.ok) {
          console.log('✓ Authenticated! Listening for events...');
          updateStatus('idle', null, 'Bridge connected');
        } else {
          console.error('Auth failed:', msg.error);
        }
        return;
      }
      
      // Handle events
      if (msg.type === 'event') {
        const eventName = msg.event;
        const payload = msg.payload;
        
        // Log more detail for agent events to debug
        if (eventName === 'agent') {
          console.log(`Event: ${eventName} stream=${payload?.stream} phase=${payload?.data?.phase || '-'}`);
        } else if (eventName.includes('exec') || eventName.includes('approval')) {
          console.log(`🚨 Event: ${eventName}`, JSON.stringify(payload).substring(0, 200));
        } else {
          console.log(`Event: ${eventName}`, payload ? JSON.stringify(payload).substring(0, 80) : '');
        }
        
        const newState = getStateFromEvent(eventName, payload);
        if (newState) {
          updateStatus(newState.state, newState.task, newState.desc);
        }
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
  
  let reconnecting = false;
  const scheduleReconnect = () => {
    if (reconnecting) return;
    reconnecting = true;
    console.log(`Reconnecting in ${RECONNECT_DELAY/1000}s...`);
    setTimeout(connect, RECONNECT_DELAY);
  };

  ws.on('close', () => {
    console.log('Disconnected.');
    updateStatus('idle', null, 'Bridge reconnecting...');
    scheduleReconnect();
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    scheduleReconnect();
  });
}

// Start
console.log('Orion Status Bridge');
console.log('===================');
connect();
