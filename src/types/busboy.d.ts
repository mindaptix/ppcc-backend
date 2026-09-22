declare module "busboy" {
  import type { Readable, Writable } from "node:stream";

  type FileStream = Readable & { truncated?: boolean };

  interface Busboy extends Writable {
    on(event: "file", listener: (name: string, stream: FileStream, info: { filename: string }) => void): this;
    on(event: "field", listener: (name: string, value: string) => void): this;
    on(event: "close", listener: () => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    on(event: "filesLimit", listener: () => void): this;
  }

  function Busboy(options: {
    headers: Record<string, string>;
    limits?: { files?: number; fileSize?: number; fields?: number; fieldSize?: number; parts?: number };
  }): Busboy;

  export default Busboy;
}
