// background/model/aiModel.ts

export abstract class AIModel {
    abstract getModelName(): string;
    abstract generate(prompt: string): Promise<string>;
}