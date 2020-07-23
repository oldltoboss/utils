export class HydraService {
  hydra;

  constructor(hydra) {
    this.hydra = hydra;
  }

  public makeHydraHTTPRequest = async (serviceName, method, path, body = {}, headers = {}) => {
    const thisServiceName = this.hydra.isService ? this.hydra.getServiceName() : 'none';
    const thisServiceIntanceID = this.hydra.isService ? this.hydra.getInstanceID() : 'none';
    const message = this.hydra.createUMFMessage({
      headers,
      body,
      to: `${serviceName}:[${method}]${path}`,
      from: `${thisServiceName}:${thisServiceIntanceID}`,
      fallbackToQueue: true,
    });
    return this.hydra.makeAPIRequest(message);
  }
}

export default HydraService;