type ServiceCreator = () => any;

class ServiceLocator {
    private services: Map<string, any> = new Map();
    private creators: Map<string, ServiceCreator> = new Map();

    register<T>(name: string, creator: ServiceCreator): void {
        this.creators.set(name, creator);
    }

    get<T>(name: string): T {
        if (!this.services.has(name)) {
            const creator = this.creators.get(name);
            if (!creator) {
                throw new Error(`Service not registered: ${name}`);
            }
            this.services.set(name, creator());
        }
        return this.services.get(name) as T;
    }

    async init(): Promise<void> {
        console.log('ServiceLocator: Initializing services...');
        for (const [name, creator] of this.creators) {
            if (!this.services.has(name)) {
                const service = creator();
                if (service.init) {
                    await service.init();
                }
                this.services.set(name, service);
            }
        }
        console.log('ServiceLocator: All services initialized.');
    }
}

const serviceLocator = new ServiceLocator();
export default serviceLocator;
