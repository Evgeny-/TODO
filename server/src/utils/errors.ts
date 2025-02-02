export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export interface CustomErrorDetails {
  originalError?: Error | unknown;
  clientHttpStatus?: HttpStatusCode;
  clientMessage?: string;
}

/** Base class for custom errors. Do not use it directly. */
export class BaseCustomError extends Error {
  details: CustomErrorDetails;
  message: string;

  constructor(message: string, details: CustomErrorDetails) {
    details = { ...details };
    super(message);
    this.name = 'CustomError';
    this.message = message;
    this.details = details;
  }
}

/**
 * Use if for errors that are caused by incorrect user input.
 * By default it will return 400 status code to the client.
 */
export class ValidationError extends BaseCustomError {
  constructor(message: string, details?: CustomErrorDetails) {
    details = {
      clientHttpStatus: HttpStatusCode.BAD_REQUEST,
      clientMessage: message,
      ...details,
    };
    super(message, details);
    this.name = 'ValidationError';
  }
}

/**
 * If the error contain sensitive information and should not be exposed
 */
export class ServerError extends BaseCustomError {
  constructor(message: string, details?: CustomErrorDetails) {
    details = {
      clientHttpStatus: HttpStatusCode.INTERNAL_SERVER_ERROR,
      clientMessage: 'Oops, something went wrong',
      ...details,
    };

    super(message, details);

    this.name = 'ServerError';
  }
}
