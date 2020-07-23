import { promisify } from 'util';
import {
  createClient,
  RedisClient,
} from 'redis';

export class HydraSanitizer{

  private SERVICE_NAME_POSITION = 2;
  private SERVICE_INSTANCE_POSITION = 3;
  private TIME_TO_LIVE = 10;
  private namespace = 'hydra:service';
  // private servicePattern = ':*:*';
  private redisClient : RedisClient;
  private keysAsync : Function;
  private delAsync : Function;
  private hdelAsync : Function;
  private hgetallAsync : Function;

  constructor(redisConfig : any) {
    this.redisClient = createClient(redisConfig);
    this.namespace = 'hydra:service';

    this.redisClient = createClient(redisConfig);
    this.keysAsync = promisify(this.redisClient.keys).bind(this.redisClient);
    this.delAsync = promisify(this.redisClient.del).bind(this.redisClient);
    this.hdelAsync = promisify(this.redisClient.hdel).bind(this.redisClient);
    this.hgetallAsync = promisify(this.redisClient.hgetall).bind(this.redisClient);

  }

  async getServiceInstances(serviceName : string = '*') {
    const keys = await this.keysAsync(`${this.namespace}:${serviceName}:*`);
    const services = keys.map((redisKeys : string) => {
      const redisKeysComponents = redisKeys.split(':');
      return redisKeysComponents[this.SERVICE_INSTANCE_POSITION];
    });
    const uniqueServices = [...new Set(services)];
    return uniqueServices;
  }

  async getServices(serviceName :string = '*') {
    const keys = await this.keysAsync(`${this.namespace}:${serviceName}:*`);
    const services = keys.map((service : string) => service.split(':')[this.SERVICE_NAME_POSITION]);
    const uniqueServices = [...new Set(services)];
    return uniqueServices;
  }

  async getServicePresence(serviceName : string) {
    const keys = await this.keysAsync(`${this.namespace}:${serviceName}:*:presence`);
    return keys;
  }

  async getNodes(serviceName? : string) {
    const nodes = await this.hgetallAsync('hydra:service:nodes');
    const keys = nodes ? Object.keys(nodes) : [];
    let resultNodes = {};
    keys.forEach((key) => {
      resultNodes[key] = JSON.parse(nodes[key]);
      resultNodes[key]['elapsed'] = null;
      Object.defineProperty(resultNodes[key], 'elapsed', {
        get() {
          const currentDate = (new Date()).valueOf();
          const updatedOn = (new Date(this.updatedOn)).valueOf();
          return (currentDate - updatedOn) / 1000;
        },
      });
    });
    if (typeof serviceName === 'string') {
      resultNodes = keys.reduce((acc, key) => {
        if (resultNodes[key].serviceName === serviceName) {
          acc[key] = resultNodes[key];
        }
        return acc;
      },                        {});
    }
    return resultNodes;
  }

  async removeService(serviceName : string) {
    console.debug('Removing service', serviceName);
    const deleteableKeys = await this.keysAsync(`${this.namespace}:${serviceName}*`);
    deleteableKeys.forEach(async (key : string) => {
      await this.delAsync(key);
    });
    return true;
  }

  redisKeyIsServiceInstanceReference(key : string) {
    return !!key.match(/^[a-f0-9]{32}$/i);
  }

  async removeOldNodes(serviceName? : string) {
    const nodes = await this.getNodes(serviceName);
    const nodeKeys = Object.keys(nodes);
    const preservedNodes = {};
    nodeKeys.forEach(async (key) => {
      const node = nodes[key];
      if (node.elapsed > this.TIME_TO_LIVE) {
        await this.hdelAsync('hydra:service:nodes', node.instanceID);
      } else {
        preservedNodes[key] = node;
      }
    });
    return preservedNodes;
  }

  async cleanSingleService(serviceName : string) {
    const instances = await this.getServiceInstances(serviceName);
    const preservedNodes = await this.removeOldNodes(serviceName);
    const preservedNodesKeys = Object.keys(preservedNodes);
    console.debug('Related redis keys', instances);
    console.debug('Preserve Nodes', serviceName, preservedNodesKeys);
    instances.forEach(async (instance : string) => {
      if (preservedNodesKeys.length === 0 ||
          (this.redisKeyIsServiceInstanceReference(instance)
            &&  !preservedNodesKeys.includes(instance))
          ) {
        await this.removeService(`${serviceName}:${instance}`);
      }
    });
  }
  async cleanServices() {
    await this.removeOldNodes();
    this.getServices().then((services) => {
      services.forEach(async (serviceName : string) => {
        await this.cleanSingleService(serviceName);
      });
    });
  }
}

export default HydraSanitizer;
