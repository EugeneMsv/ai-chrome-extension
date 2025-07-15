// background/model/auth/storage/modelAuthenticationStorage.ts
import { ModelAuthentication, ModelAuthenticationPlainObject } from '../modelAuthentication'; // Adjusted import
import { ModelIdentifier } from '../../modelIdentifier';

const AUTH_STORAGE_PREFIX = 'modelAuth_';

export class ModelAuthenticationStorage {


private _generateStorageKey(modelIdentifier: ModelIdentifier): string {
  return `${AUTH_STORAGE_PREFIX}${modelIdentifier.toString()}`;
}

async saveAuthentication(authInstance: ModelAuthentication): Promise<void> {


  const key = this._generateStorageKey(authInstance.modelIdentifier);
  const storableObject = authInstance.toPlainObject();

  return new Promise<void>((resolve, reject) => { // Explicit Promise type
    chrome.storage.sync.set({ [key]: storableObject }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error saving authentication for key "${key}":`, chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        console.log(`Authentication saved for key: ${key}`, storableObject);
        resolve();
      }
    });
  });
}

async getAuthentication(modelIdentifier: ModelIdentifier): Promise<ModelAuthenticationPlainObject | null> {
    const key = this._generateStorageKey(modelIdentifier);
    return new Promise<ModelAuthenticationPlainObject | null>((resolve, reject) => {
        chrome.storage.sync.get([key], (result) => {
            if (chrome.runtime.lastError) {
              console.error(`Error retrieving authentication for key "${key}":`, chrome.runtime.lastError.message);
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              if (result && result[key]) {
                console.log(`Authentication retrieved for key: ${key}`, result[key]);
                resolve(result[key] as ModelAuthenticationPlainObject); // Type assertion
              } else {
                console.log(`No authentication found for key: ${key}`);
                resolve(null);
              }
            }
        });
    });
}

async deleteAuthentication(modelIdentifier: ModelIdentifier): Promise<void> {

  const key = this._generateStorageKey(modelIdentifier);
  return new Promise<void>((resolve, reject) => {
    chrome.storage.sync.remove(key, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error deleting authentication for key "${key}":`, chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        console.log(`Authentication deleted for key: ${key}`);
        resolve();
      }
    });
  });
}

        