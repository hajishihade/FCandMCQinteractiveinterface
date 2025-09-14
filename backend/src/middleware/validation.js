const validateCardIds = (req, res, next) => {
  const { cardIds } = req.body;

  if (!cardIds || !Array.isArray(cardIds)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'cardIds must be an array',
      timestamp: new Date().toISOString()
    });
  }

  if (cardIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'cardIds array cannot be empty',
      timestamp: new Date().toISOString()
    });
  }

  const invalidCardIds = cardIds.filter(id => !Number.isInteger(Number(id)) || Number(id) < 0);
  if (invalidCardIds.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid cardIds: ${invalidCardIds.join(', ')}. Must be non-negative integers.`,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

const validateInteraction = (req, res, next) => {
  const { cardId, result, difficulty, confidenceWhileSolving, timeSpent } = req.body;

  if (cardId === undefined || cardId === null) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'cardId is required',
      timestamp: new Date().toISOString()
    });
  }

  if (!Number.isInteger(Number(cardId)) || Number(cardId) < 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'cardId must be a non-negative integer',
      timestamp: new Date().toISOString()
    });
  }

  if (!result || !['Right', 'Wrong'].includes(result)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'result must be either "Right" or "Wrong"',
      timestamp: new Date().toISOString()
    });
  }

  if (!difficulty || !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'difficulty must be "Easy", "Medium", or "Hard"',
      timestamp: new Date().toISOString()
    });
  }

  if (!confidenceWhileSolving || !['High', 'Low'].includes(confidenceWhileSolving)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'confidenceWhileSolving must be "High" or "Low"',
      timestamp: new Date().toISOString()
    });
  }

  if (timeSpent === undefined || timeSpent === null || !Number.isInteger(Number(timeSpent)) || Number(timeSpent) < 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'timeSpent must be a non-negative integer (seconds)',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

const validateSeriesTitle = (req, res, next) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'title is required and must be a non-empty string',
      timestamp: new Date().toISOString()
    });
  }

  if (title.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'title cannot exceed 200 characters',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

const validatePagination = (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'page must be a positive integer',
      timestamp: new Date().toISOString()
    });
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'limit must be between 1 and 100',
      timestamp: new Date().toISOString()
    });
  }

  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};

export {
  validateCardIds,
  validateInteraction,
  validateSeriesTitle,
  validatePagination
};