import mongoose from 'mongoose';

const cardInteractionSchema = new mongoose.Schema({
  cardId: {
    type: Number,
    required: true
  },
  interaction: {
    result: {
      type: String,
      enum: ['Right', 'Wrong'],
      required: false
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: false
    },
    confidenceWhileSolving: {
      type: String,
      enum: ['High', 'Low'],
      required: false
    },
    timeSpent: {
      type: Number,
      required: false,
      min: 0
    }
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  generatedFrom: {
    type: Number,
    default: null
  },
  cards: [cardInteractionSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const seriesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  sessions: [sessionSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  collection: 'series'
});

seriesSchema.statics.createSeries = async function(seriesData) {
  const series = new this(seriesData);
  return await series.save();
};

seriesSchema.methods.addSession = function(sessionData) {
  const nextSessionId = this.sessions.length + 1;
  const newSession = {
    sessionId: nextSessionId,
    ...sessionData
  };
  this.sessions.push(newSession);
  return this.save();
};

seriesSchema.methods.getSession = function(sessionId) {
  return this.sessions.find(session => session.sessionId === sessionId);
};

seriesSchema.methods.addCardInteraction = function(sessionId, cardId, interactionData) {
  const session = this.getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Find if card already exists in session
  const existingCardIndex = session.cards.findIndex(card => card.cardId === cardId);

  if (existingCardIndex !== -1) {
    // Update existing card with interaction
    session.cards[existingCardIndex].interaction = interactionData;
  } else {
    // Add new card with interaction (fallback)
    const cardInteraction = {
      cardId: cardId,
      interaction: interactionData
    };
    session.cards.push(cardInteraction);
  }

  return this.save();
};

seriesSchema.methods.completeSession = function(sessionId) {
  const session = this.getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.status = 'completed';
  session.completedAt = new Date();
  return this.save();
};

seriesSchema.methods.completeSeries = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

const Series = mongoose.model('Series', seriesSchema);

export default Series;