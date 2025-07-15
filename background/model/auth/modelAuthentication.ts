// background/model/auth/modelAuthentication.ts
import { ModelIdentifier } from '../modelIdentifier'; // Ensure path is correct

export abstract class ModelAuthentication {
  public readonly modelIdentifier: ModelIdentifier;
  public readonly authType: string;

  constructor(modelIdentifier: ModelIdentifier) {
    this.modelIdentifier = modelIdentifier;
    this.authType = this.constructor.name;
  }

}

export class ApiKeyModelAuthentication extends ModelAuthentication {
  public readonly apiKey: string;

  constructor(modelIdentifier: ModelIdentifier, apiKey: string) { // apiKey: string
    super(modelIdentifier);
    this.apiKey = apiKey;
  }

}