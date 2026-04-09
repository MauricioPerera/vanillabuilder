/**
 * VanillaBuilder AI API
 *
 * 100% frontend — no backend, no workers, no server.
 * Deploy on Cloudflare Pages (or any static hosting) and use from any browser.
 *
 * Usage from any agent/script:
 *
 *   <script type="module">
 *     import { AIBuilder, getToolDefinitions } from 'https://your-site.pages.dev/ai/index.js';
 *
 *     const builder = new AIBuilder();
 *     builder.init();
 *     builder.addSection('hero', { headline: 'Hello!' });
 *     const { data: html } = builder.getFullPage();
 *     document.body.innerHTML = html;
 *   </script>
 *
 * For AI tool definitions:
 *   const tools = getToolDefinitions('anthropic'); // or 'openai' or 'generic'
 *
 * For dispatch (agent sends method name + params):
 *   const result = builder.execute('addSection', { type: 'hero', options: { headline: 'Hi' } });
 */
export { default as AIBuilder } from './AIBuilder.js';
export { schemas, getToolDefinitions } from './schemas.js';
