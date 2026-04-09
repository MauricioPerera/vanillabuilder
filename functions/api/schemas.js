const schemas = {
  setTheme: { name: 'setTheme', description: 'Set the design system / theme. All sections will use these values. Colors, fonts, sizes, spacing, borderRadius, maxWidth.', parameters: { type: 'object', properties: { colors: { type: 'object', description: 'Color palette: {primary, primaryLight, primaryDark, secondary, accent, background, surface, surfaceDark, text, textMuted, textLight, border}', additionalProperties: { type: 'string' } }, fonts: { type: 'object', description: 'Font families: {heading, body}', additionalProperties: { type: 'string' } }, sizes: { type: 'object', description: 'Font sizes: {headingLg, headingMd, headingSm, body, small, tiny}', additionalProperties: { type: 'string' } }, spacing: { type: 'object', description: 'Spacing: {sectionY, sectionX, cardPadding, gap}', additionalProperties: { type: 'string' } }, borderRadius: { type: 'string', description: 'Border radius (e.g. "8px", "12px", "0")' }, maxWidth: { type: 'string', description: 'Max content width (e.g. "960px", "1200px")' } } } },
  getTheme: { name: 'getTheme', description: 'Get the current design system / theme with all values', parameters: { type: 'object', properties: {} } },
  clearPage: { name: 'clearPage', description: 'Remove all content from the page', parameters: { type: 'object', properties: {} } },
  addSection: { name: 'addSection', description: 'Add a pre-built section. Types: hero, features, cta, testimonials, pricing, footer, contact, faq, navbar, stats', parameters: { type: 'object', properties: { type: { type: 'string', enum: ['hero','features','cta','testimonials','pricing','footer','contact','faq','navbar','stats'] }, options: { type: 'object', description: 'Section options. hero:{headline,subheadline,buttonText,buttonUrl,background}. features:{heading,items:[{icon,title,description}]}. pricing:{heading,plans:[{name,price,period,features[],popular}]}. footer:{copyright,columns:[{title,links:[{text,url}]}]}. cta:{headline,subheadline,buttonText}. testimonials:{heading,items:[{quote,author,role}]}. contact:{heading,buttonText}. faq:{heading,items:[{question,answer}]}. navbar:{brand,links:[{text,url}],ctaText}. stats:{items:[{value,label}]}.', additionalProperties: true } }, required: ['type'] } },
  addHTML: { name: 'addHTML', description: 'Add raw HTML to the page', parameters: { type: 'object', properties: { html: { type: 'string', description: 'HTML string' } }, required: ['html'] } },
  addCSSRule: { name: 'addCSSRule', description: 'Add a CSS rule', parameters: { type: 'object', properties: { selector: { type: 'string' }, styles: { type: 'object', additionalProperties: { type: 'string' } } }, required: ['selector','styles'] } },
  removeSection: { name: 'removeSection', description: 'Remove a section by index', parameters: { type: 'object', properties: { index: { type: 'number' } }, required: ['index'] } },
  getHTML: { name: 'getHTML', description: 'Get the page body HTML', parameters: { type: 'object', properties: {} } },
  getCSS: { name: 'getCSS', description: 'Get CSS rules', parameters: { type: 'object', properties: {} } },
  getFullPage: { name: 'getFullPage', description: 'Get complete HTML document', parameters: { type: 'object', properties: { title: { type: 'string' }, lang: { type: 'string' } } } },
  getPageInfo: { name: 'getPageInfo', description: 'Get page summary', parameters: { type: 'object', properties: {} } },
  getAvailableSections: { name: 'getAvailableSections', description: 'List available section types', parameters: { type: 'object', properties: {} } },
  buildLandingPage: { name: 'buildLandingPage', description: 'Build a full landing page from config', parameters: { type: 'object', properties: { title: { type: 'string' }, navbar: { type: 'object' }, hero: { type: 'object' }, features: { type: 'object' }, stats: { type: 'object' }, testimonials: { type: 'object' }, pricing: { type: 'object' }, cta: { type: 'object' }, faq: { type: 'object' }, contact: { type: 'object' }, footer: { type: 'object' } } } },
};

function getToolDefinitions(format = 'generic') {
  const tools = Object.values(schemas);
  if (format === 'anthropic') return tools.map(t => ({ name: t.name, description: t.description, input_schema: t.parameters }));
  if (format === 'openai') return tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } }));
  return tools;
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'anthropic';
  return Response.json({ ok: true, data: getToolDefinitions(format) });
}
