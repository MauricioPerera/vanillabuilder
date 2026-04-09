/**
 * JSON Schema definitions for AIBuilder methods
 *
 * Compatible with OpenAI function calling, Anthropic tool_use, and generic JSON Schema.
 * Use getToolDefinitions() to get the array in the format needed by your AI provider.
 */

export const schemas = {
  addHTML: {
    name: 'addHTML',
    description: 'Add raw HTML content to the page, optionally inside a specific target element',
    parameters: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML string to add to the page' },
        targetSelector: { type: 'string', description: 'CSS selector of parent element to insert into. Omit to add to page root.' },
      },
      required: ['html'],
    },
  },

  addComponent: {
    name: 'addComponent',
    description: 'Add a component from a JSON definition with tag, styles, classes, and children',
    parameters: {
      type: 'object',
      properties: {
        tagName: { type: 'string', description: 'HTML tag name (div, section, h1, p, img, etc.)', default: 'div' },
        content: { type: 'string', description: 'Text content inside the element' },
        classes: { type: 'array', items: { type: 'string' }, description: 'CSS class names' },
        style: { type: 'object', additionalProperties: { type: 'string' }, description: 'Inline CSS styles as key-value pairs' },
        attributes: { type: 'object', additionalProperties: { type: 'string' }, description: 'HTML attributes (href, src, alt, etc.)' },
        children: { type: 'array', items: { type: 'object' }, description: 'Nested child component definitions' },
      },
    },
  },

  addSection: {
    name: 'addSection',
    description: 'Add a pre-built section to the page. Types: hero, features, cta, testimonials, pricing, footer, contact, faq, navbar, stats',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['hero', 'features', 'cta', 'testimonials', 'pricing', 'footer', 'contact', 'faq', 'navbar', 'stats'],
          description: 'Section type to add',
        },
        options: {
          type: 'object',
          description: 'Section-specific options. For hero: {headline, subheadline, buttonText, buttonUrl, background}. For features: {heading, items:[{icon, title, description}]}. For pricing: {heading, plans:[{name, price, features[], popular}]}. For footer: {copyright, columns:[{title, links:[{text, url}]}]}. For contact: {heading, buttonText}. For faq: {heading, items:[{question, answer}]}. For navbar: {brand, links:[{text, url}], ctaText}. For stats: {items:[{value, label}]}. For cta: {headline, subheadline, buttonText}. For testimonials: {heading, items:[{quote, author, role}]}.',
          additionalProperties: true,
        },
      },
      required: ['type'],
    },
  },

  updateContent: {
    name: 'updateContent',
    description: 'Update the text/HTML content of element(s) matching a CSS selector',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to find elements (.class, #id, tag)' },
        content: { type: 'string', description: 'New text or HTML content' },
      },
      required: ['selector', 'content'],
    },
  },

  updateStyle: {
    name: 'updateStyle',
    description: 'Set inline CSS styles on element(s) matching a selector. Merges with existing styles.',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector (.class, #id, tag)' },
        styles: {
          type: 'object',
          description: 'CSS properties as key-value pairs (e.g. {"color":"red","font-size":"16px","padding":"20px"})',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['selector', 'styles'],
    },
  },

  updateAttribute: {
    name: 'updateAttribute',
    description: 'Set an HTML attribute on element(s) matching a selector',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        key: { type: 'string', description: 'Attribute name (href, src, alt, title, data-*, etc.)' },
        value: { type: 'string', description: 'Attribute value' },
      },
      required: ['selector', 'key', 'value'],
    },
  },

  addClass: {
    name: 'addClass',
    description: 'Add a CSS class to element(s) matching a selector',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        className: { type: 'string', description: 'CSS class name to add (without dot)' },
      },
      required: ['selector', 'className'],
    },
  },

  removeClass: {
    name: 'removeClass',
    description: 'Remove a CSS class from element(s) matching a selector',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector' },
        className: { type: 'string', description: 'CSS class name to remove' },
      },
      required: ['selector', 'className'],
    },
  },

  removeComponent: {
    name: 'removeComponent',
    description: 'Delete element(s) matching a CSS selector from the page',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element(s) to remove' },
      },
      required: ['selector'],
    },
  },

  moveComponent: {
    name: 'moveComponent',
    description: 'Move a component to a new position relative to a target element',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element to move' },
        targetSelector: { type: 'string', description: 'CSS selector of destination element' },
        position: { type: 'string', enum: ['before', 'after', 'inside'], description: 'Where to place relative to target', default: 'inside' },
      },
      required: ['selector', 'targetSelector'],
    },
  },

  cloneComponent: {
    name: 'cloneComponent',
    description: 'Duplicate an element (deep clone with all children)',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element to clone' },
      },
      required: ['selector'],
    },
  },

  wrapComponent: {
    name: 'wrapComponent',
    description: 'Wrap an element inside a new container element',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element to wrap' },
        wrapper: {
          type: 'object',
          description: 'Wrapper element definition (e.g. {"tagName":"div","classes":["container"],"style":{"max-width":"960px"}})',
        },
      },
      required: ['selector'],
    },
  },

  addCSSRule: {
    name: 'addCSSRule',
    description: 'Add a CSS rule with a selector and style declarations. Supports media queries and pseudo-states.',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector (e.g. ".my-class", "#hero h1", "body")' },
        styles: { type: 'object', additionalProperties: { type: 'string' }, description: 'CSS declarations' },
        options: {
          type: 'object',
          properties: {
            mediaQuery: { type: 'string', description: 'Media query (e.g. "(max-width: 768px)")' },
            state: { type: 'string', description: 'Pseudo-state (e.g. ":hover", ":focus")' },
          },
        },
      },
      required: ['selector', 'styles'],
    },
  },

  removeCSSRule: {
    name: 'removeCSSRule',
    description: 'Remove a CSS rule by its selector',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of rule to remove' },
      },
      required: ['selector'],
    },
  },

  clearPage: {
    name: 'clearPage',
    description: 'Remove all content from the current page',
    parameters: { type: 'object', properties: {} },
  },

  getHTML: {
    name: 'getHTML',
    description: 'Get the generated HTML output of the current page content',
    parameters: { type: 'object', properties: {} },
  },

  getCSS: {
    name: 'getCSS',
    description: 'Get the generated CSS output including all rules',
    parameters: { type: 'object', properties: {} },
  },

  getFullPage: {
    name: 'getFullPage',
    description: 'Get a complete HTML page (<!DOCTYPE html>...) with embedded CSS',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title', default: 'Untitled Page' },
        lang: { type: 'string', description: 'Language code', default: 'en' },
        font: { type: 'string', description: 'Font family for body' },
      },
    },
  },

  getComponentTree: {
    name: 'getComponentTree',
    description: 'Get the component hierarchy as a tree structure with tag names, classes, and children',
    parameters: { type: 'object', properties: {} },
  },

  findComponents: {
    name: 'findComponents',
    description: 'Find components matching a CSS selector and return their info',
    parameters: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector to search for' },
      },
      required: ['selector'],
    },
  },

  getPageInfo: {
    name: 'getPageInfo',
    description: 'Get summary information about the current page: component count, CSS classes used',
    parameters: { type: 'object', properties: {} },
  },

  getAvailableSections: {
    name: 'getAvailableSections',
    description: 'List all available pre-built section types that can be added with addSection()',
    parameters: { type: 'object', properties: {} },
  },

  buildLandingPage: {
    name: 'buildLandingPage',
    description: 'Generate a complete landing page from a configuration object. Automatically adds navbar, hero, features, pricing, CTA, and footer sections.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title' },
        navbar: { type: 'object', description: 'Navbar options: {brand, links:[{text,url}], ctaText}. Set to false to skip.' },
        hero: { type: 'object', description: 'Hero options: {headline, subheadline, buttonText, buttonUrl, background}' },
        features: { type: 'object', description: 'Features options: {heading, items:[{icon, title, description}]}' },
        stats: { type: 'object', description: 'Stats options: {items:[{value, label}]}' },
        testimonials: { type: 'object', description: 'Testimonials: {heading, items:[{quote, author, role}]}' },
        pricing: { type: 'object', description: 'Pricing: {heading, plans:[{name, price, period, features[], popular, buttonText}]}' },
        cta: { type: 'object', description: 'CTA: {headline, subheadline, buttonText}' },
        faq: { type: 'object', description: 'FAQ: {heading, items:[{question, answer}]}' },
        contact: { type: 'object', description: 'Contact form: {heading, buttonText}' },
        footer: { type: 'object', description: 'Footer: {copyright, columns:[{title, links/text}]}' },
      },
    },
  },
};

/**
 * Get tool definitions array formatted for a specific AI provider
 * @param {'anthropic'|'openai'|'generic'} [format='generic']
 * @returns {Array}
 */
export function getToolDefinitions(format = 'generic') {
  const tools = Object.values(schemas);

  if (format === 'anthropic') {
    return tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));
  }

  if (format === 'openai') {
    return tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  // Generic format
  return tools;
}
