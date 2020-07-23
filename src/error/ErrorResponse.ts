export default class ErrorResponse extends Error {
  public statusCode : number;
  public message : string;
  constructor(msg) {
    super(msg);
  }

  toJSON() {
    return {
      message : this.message,
      statusCode : this.statusCode,
    };
  }
}