// Anthropic AI Service
// Handles AI content generation using Claude API

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Generate content using Claude AI
 * @param {Object} params - Content generation parameters
 * @param {string} params.contentType - Type of content (Blog Post, X/Threads Post, LinkedIn Post)
 * @param {string} params.topic - Topic to write about
 * @param {string} params.keywords - Keywords to include (optional)
 * @returns {Promise<string>} Generated content
 */
exports.generateContent = async ({ contentType, topic, keywords }) => {
  try {
    // Build the prompt based on content type
    const prompt = buildPrompt(contentType, topic, keywords);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extract text content from response
    const content = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n\n');

    return content;

  } catch (error) {
    console.error('Anthropic API error:', error);
    throw new Error('Failed to generate content with AI');
  }
};

/**
 * Build prompt based on content type
 */
function buildPrompt(contentType, topic, keywords) {
  const keywordsSection = keywords 
    ? `\n\nKeywords to naturally incorporate: ${keywords}` 
    : '';

  const contentSpecs = {
    'Blog Post': {
      length: '600-900 words',
      structure: `
- Compelling headline
- Engaging introduction with a hook
- 3-5 well-structured sections with subheadings
- Actionable insights or takeaways
- Strong conclusion with call-to-action`,
      tone: 'professional yet conversational, informative and engaging'
    },
    'X/Threads Post': {
      length: '3-7 tweets (280 characters each)',
      structure: `
- Start with an attention-grabbing hook
- Number each tweet (1/7, 2/7, etc.)
- One main idea per tweet
- End with a compelling conclusion or CTA
- Use emojis strategically for visual appeal`,
      tone: 'conversational, punchy, and shareable'
    },
    'LinkedIn Post': {
      length: '150-300 words',
      structure: `
- Personal or professional hook in first line
- Share a story, insight, or valuable lesson
- Use short paragraphs (1-2 sentences each)
- Include relevant hashtags (3-5)
- End with a question or CTA to encourage engagement`,
      tone: 'professional, authentic, and thought-provoking'
    }
  };

  const spec = contentSpecs[contentType] || contentSpecs['Blog Post'];

  return `You are an expert content creator specializing in SEO and AI-optimized content. Create a ${contentType} about the following topic:

${topic}${keywordsSection}

Requirements:
- Length: ${spec.length}
- Tone: ${spec.tone}
- Structure: ${spec.structure}

SEO & AI Optimization Guidelines:
1. Use clear, descriptive language that both humans and AI can easily understand
2. Include relevant keywords naturally throughout the content
3. Create scannable content with clear structure
4. Focus on providing genuine value and answering user intent
5. Use active voice and strong verbs
6. Make it engaging and shareable

Write ONLY the content itself - no preamble, no explanations, no meta-commentary. Start directly with the content.`;
}

/**
 * Validate content quality (optional enhancement)
 */
exports.validateContent = (content, minWords = 50) => {
  const wordCount = content.trim().split(/\s+/).length;
  
  if (wordCount < minWords) {
    throw new Error('Generated content is too short');
  }

  return {
    isValid: true,
    wordCount
  };
};