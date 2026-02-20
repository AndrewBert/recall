import type { Env } from '../types'

const SYSTEM_PROMPT = `You are a design system architect for an educational flashcard app.
Given a study topic, generate a cohesive visual color theme that evokes that subject's mood and character.

Rules:
- All colors must be valid hex codes (#RRGGBB format)
- body text must maintain WCAG AA contrast (4.5:1 minimum) against the page background
- onPrimary must contrast well against the primary color
- primaryHover must be a darker shade of primary
- surfaceHover must be between surface and surfaceActive in lightness
- border should be a subtle tone that complements the surface color
- Use cool tones (blues, greens, teals) for sciences and technology
- Use warm tones (ambers, oranges, rich reds) for humanities and social sciences
- Use neutral/sophisticated tones (slates, indigos) for mathematics and logic
- Use earthy/historical tones (sepias, deep greens, burgundy) for history
- Use creative/vibrant tones for arts, music, and design topics
- Use organic/natural tones (greens, earth tones) for biology and environmental topics
- accent should be a contrasting highlight color that complements the primary
- Commit to a bold, cohesive aesthetic rather than timid muted palettes
- The page background should be a very light tint related to the theme
- surface should be white or a very light variant that cards look good on`

const THEME_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    colors: {
      type: 'object' as const,
      properties: {
        primary: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Main action color for buttons, logo, links, and focus rings' },
        primaryHover: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Darker shade of primary for hover/active states' },
        accent: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Contrasting highlight color for badges and emphasis' },
        page: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Very light page background color' },
        surface: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Card and header background (white or near-white)' },
        surfaceHover: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Subtle hover state for cards and secondary button backgrounds' },
        surfaceActive: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Active/pressed state for secondary buttons and progress bar background' },
        body: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Primary text color for headings and content — must contrast with page' },
        secondary: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Secondary text for descriptions, form labels, and nav links' },
        tertiary: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Muted text for icons, hints, and very subtle labels' },
        onPrimary: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Text color displayed on primary-colored backgrounds' },
        border: { type: 'string' as const, pattern: '^#[0-9a-fA-F]{6}$', description: 'Subtle border color for cards and dividers' },
      },
      required: ['primary', 'primaryHover', 'accent', 'page', 'surface', 'surfaceHover', 'surfaceActive', 'body', 'secondary', 'tertiary', 'onPrimary', 'border'],
      additionalProperties: false,
    },
  },
  required: ['colors'],
  additionalProperties: false,
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { topic } = await context.request.json<{ topic: string }>()

  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    return Response.json({ error: 'Missing or empty topic' }, { status: 400 })
  }

  if (!context.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': context.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Generate a visual theme for studying: "${topic.trim()}"` }],
      output_config: {
        format: {
          type: 'json_schema',
          schema: THEME_JSON_SCHEMA,
        },
      },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Anthropic API error:', response.status, errorBody)
    return Response.json({ error: 'Theme generation failed' }, { status: 502 })
  }

  const data = await response.json<{
    content: Array<{ type: string; text?: string }>
    stop_reason: string
  }>()

  if (data.stop_reason === 'refusal') {
    return Response.json({ error: 'Theme generation refused' }, { status: 422 })
  }

  const textBlock = data.content.find((block) => block.type === 'text')
  if (!textBlock?.text) {
    return Response.json({ error: 'No text in response' }, { status: 502 })
  }

  const theme = JSON.parse(textBlock.text)
  return Response.json(theme)
}
