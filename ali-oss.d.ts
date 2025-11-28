declare module 'ali-oss' {
  interface OSSOptions {
    region?: string;
    accessKeyId?: string;
    accessKeySecret?: string;
    bucket?: string;
    secure?: boolean;
    [key: string]: any;
  }

  interface SignatureUrlOptions {
    method?: string;
    expires?: number;
    'Content-Type'?: string;
    [key: string]: any;
  }

  class OSS {
    constructor(options: OSSOptions);
    signatureUrl(name: string, options?: SignatureUrlOptions): string;
    [key: string]: any;
  }

  export default OSS;
}

