// Lucas avanzado · motor en segundo plano (Web Worker): la página no se bloquea mientras piensa
import { WebWorkerMLCEngineHandler } from "https://esm.run/@mlc-ai/web-llm";
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => { handler.onmessage(msg); };
