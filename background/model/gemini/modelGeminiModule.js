// background/model/gemini/geminiModule.js

import { asClass } from 'awilix';
import { GeminiGenerationConfigBuilder } from './geminiGenerationConfigBuilder.ts';
import { Gemini2FlashModel } from './gemini2FlashModel.ts';

/**
 * Awilix module for Gemini-related services.
 * @param {object} container - The Awilix container instance.
 */
export function loadGeminiModule(container) {
  container.register({
    // This builder is specific to Gemini and used by Gemini2FlashModel
    geminiGenerationConfigBuilder: asClass(GeminiGenerationConfigBuilder).singleton(),

    // The Gemini2FlashModel itself. Awilix will inject 'apiKeyService'
    // (expected to be registered in the root or another module)
    // and 'geminiGenerationConfigBuilder' (registered above in this module).
    gemini2FlashModel: asClass(Gemini2FlashModel).singleton(),
  });
  console.log('Awilix: Gemini module loaded and services registered.');
}