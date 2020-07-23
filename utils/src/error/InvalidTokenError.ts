import ErrorResponse from './ErrorResponse';

export const ERROR_MESSAGE_INVALID_TOKEN = 'Request token could not be authenticated';
export const HTTP_STATUS_CODE_UNAUTHORIZED = 401;

export default class InvalidTokenError extends ErrorResponse {
  constructor() {
    super(ERROR_MESSAGE_INVALID_TOKEN);
    this.statusCode = HTTP_STATUS_CODE_UNAUTHORIZED;
  }
}