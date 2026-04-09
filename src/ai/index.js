/**
 * AI module exports for VanillaBuilder
 *
 * @example
 * import { AIBuilder, schemas, getToolDefinitions } from 'vanillabuilder/ai';
 *
 * const builder = new AIBuilder();
 * builder.init();
 * builder.addSection('hero', { headline: 'Hello!' });
 * const { data: html } = builder.getFullPage();
 *
 * // For AI function calling
 * const tools = getToolDefinitions('anthropic'); // or 'openai'
 */
export { default as AIBuilder } from './AIBuilder.js';
export { schemas, getToolDefinitions } from './schemas.js';
