declare module "openclaw/plugin-sdk" {
  export interface OpenClawPluginApi {
    logger: { info: (...args: any[]) => void; warn: (...args: any[]) => void; debug: (...args: any[]) => void; error: (...args: any[]) => void; };
    resolvePath: (p: string) => string;
    [key: string]: any;
  }
}
