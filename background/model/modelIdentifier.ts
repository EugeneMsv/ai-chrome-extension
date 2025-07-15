export class ModelIdentifier {

   public readonly name: string;
   public readonly version: string;

   constructor(name: string, version: string) {
     this.name = name.trim();
     this.version = version.trim();
   }

   toString(): string { return `${this.name}_${this.version}`;
   }

}
        