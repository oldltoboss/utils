import { HTTPRequestMethod, HydraService } from '../../hydra/http-request';
import oauth2Server from 'oauth2-server';
import InvalidTokenError from '../../error/InvalidTokenError';

const Request = oauth2Server.Request;
const Response = oauth2Server.Response;

const DEFAULT_AUTH_SERVICE_NAME = 'krack-auth';

export class OAuth2Middleware {
  private hydraService;
  private authService;

  constructor(hydra) {
    this.hydraService = new HydraService(hydra);
    this.authService = process.env.AUTH_SERVICE || DEFAULT_AUTH_SERVICE_NAME;
  }

  public authenticateRequest = async (req, res, next) => {
    let user;
    try {
      user = await this.authenticateRequestThroughHydra(req);
      if (!user) {
        return next(new InvalidTokenError());
      }
      req.user = user;
      return next();
    } catch (error) {
      error.code = 401;
      return next(error);
    }
  }

  private authenticateRequestThroughHydra = async (req) => {
    const response = await this.hydraService.makeHydraHTTPRequest(
      this.authService,
      HTTPRequestMethod.GET,
      '/api/profile',
      undefined,
      req.headers,
    );
    return response.data;
  }
}

export default OAuth2Middleware;