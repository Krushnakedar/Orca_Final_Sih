const { orchestrator } = require('../agents');
const MemoryService = require('../services/memory.service');

// Bounded in-memory conversation session store with TTL & LRU eviction
const MAX_SESSIONS = 1000;
const MAX_MESSAGES_PER_SESSION = 50;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

class BoundedSessionStore {
  constructor(maxSessions = MAX_SESSIONS, ttlMs = SESSION_TTL_MS) {
    this.maxSessions = maxSessions;
    this.ttlMs = ttlMs;
    this.store = new Map();

    const pruneTimer = setInterval(() => this.pruneExpired(), 15 * 60 * 1000);
    if (pruneTimer.unref) pruneTimer.unref();
  }

  pruneExpired() {
    const now = Date.now();
    for (const [id, session] of this.store.entries()) {
      if (now - session.lastAccessedAt > this.ttlMs) {
        this.store.delete(id);
      }
    }
  }

  get(id) {
    const session = this.store.get(id);
    if (!session) return null;
    if (Date.now() - session.lastAccessedAt > this.ttlMs) {
      this.store.delete(id);
      return null;
    }
    session.lastAccessedAt = Date.now();
    // Refresh LRU order in Map
    this.store.delete(id);
    this.store.set(id, session);
    return session.messages;
  }

  has(id) {
    return this.get(id) !== null;
  }

  append(id, ...messages) {
    const now = Date.now();
    let session = this.store.get(id);

    if (!session || (now - session.lastAccessedAt > this.ttlMs)) {
      if (this.store.size >= this.maxSessions) {
        this.pruneExpired();
        if (this.store.size >= this.maxSessions) {
          const oldestKey = this.store.keys().next().value;
          if (oldestKey) this.store.delete(oldestKey);
        }
      }
      session = { messages: [], lastAccessedAt: now };
    }

    session.lastAccessedAt = now;
    session.messages.push(...messages);
    if (session.messages.length > MAX_MESSAGES_PER_SESSION) {
      session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION);
    }

    this.store.delete(id);
    this.store.set(id, session);
    return session.messages;
  }

  delete(id) {
    return this.store.delete(id);
  }
}

const conversationSessions = new BoundedSessionStore();

const handleChatMessage = async (req, res, next) => {
  try {
    const { message, conversationId, location, vesselProfile, language = 'en' } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long (maximum 2,000 characters)'
      });
    }

    const convId = conversationId || `conv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Execute query through real Agent Orchestrator Pipeline:
    // IntentAgent -> PlannerAgent -> Parallel Workers -> AggregatorAgent -> RiskEngine -> ExplainerAgent
    const aiResponse = await orchestrator.processQuery({
      message,
      location,
      vesselProfile,
      conversationId: convId,
      language
    });

    const userMsgObj = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toISOString()
    };

    const aiMsgObj = {
      id: `msg_a_${Date.now()}`,
      sender: 'ai',
      ...aiResponse
    };

    conversationSessions.append(convId, userMsgObj, aiMsgObj);

    return res.status(200).json({
      success: true,
      conversationId: convId,
      userMessage: userMsgObj,
      aiResponse: aiMsgObj
    });
  } catch (error) {
    next(error);
  }
};

const getChatHistory = (req, res, next) => {
  try {
    const convId = req.query.conversationId;
    const history = convId ? conversationSessions.get(convId) : null;
    if (!convId || !history) {
      return res.status(200).json({
        success: true,
        conversationId: convId || 'default',
        messages: []
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: convId,
      messages: history
    });
  } catch (error) {
    next(error);
  }
};

const resetChatSession = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    if (conversationId) {
      conversationSessions.delete(conversationId);
      await MemoryService.clearConversation(conversationId);
    }
    return res.status(200).json({
      success: true,
      message: 'Conversation history reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChatMessage,
  getChatHistory,
  resetChatSession
};
