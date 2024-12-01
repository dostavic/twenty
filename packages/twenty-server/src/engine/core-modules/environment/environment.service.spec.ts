import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvironmentService } from './environment.service';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvironmentService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(), // Mock ConfigService
          },
        },
      ],
    }).compile();

    service = module.get<EnvironmentService>(EnvironmentService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get()', () => {
    it('should return a default value if key is not set', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      expect(service.get('PORT')).toBe(3000); // Default value from EnvironmentVariables
    });

    it('should return the value from ConfigService', () => {
      jest.spyOn(configService, 'get').mockReturnValue(5000);
      expect(service.get('PORT')).toBe(5000);
    });
  });

  describe('Using test doubles', () => {
    it('should use mock ConfigService', () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(8080),
      };
      const mockService = new EnvironmentService(mockConfigService as any);
      expect(mockService.get('PORT')).toBe(8080);
    });

    it('should use fake ConfigService', () => {
      const fakeConfigService = {
        get: (key: string) => (key === 'PORT' ? 8080 : undefined),
      };
      const fakeService = new EnvironmentService(fakeConfigService as any);
      expect(fakeService.get('PORT')).toBe(8080);
    });

    it('should use stub for get method', () => {
      const configServiceStub = new ConfigService();
      jest.spyOn(configServiceStub, 'get').mockImplementation((key) => {
        if (key === 'PORT') return 8080;
        return undefined;
      });

      const stubService = new EnvironmentService(configServiceStub);
      expect(stubService.get('PORT')).toBe(8080);
    });

    it('should return default values for various keys if not set', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      expect(service.get('NODE_ENV')).toBe('development'); // Default from EnvironmentVariables
      expect(service.get('PORT')).toBe(3000); // Default from EnvironmentVariables
      expect(service.get('DEBUG_PORT')).toBe(9000); // Default from EnvironmentVariables
    });

    it('should validate dependent fields when IS_BILLING_ENABLED is true', () => {
      const config = {
        IS_BILLING_ENABLED: true,
        BILLING_PLAN_REQUIRED_LINK: 'http://example.com',
      };
    
      const validated = service.get('IS_BILLING_ENABLED');
      expect(validated).toBe(true);
      expect(service.get('BILLING_PLAN_REQUIRED_LINK')).toBe('http://example.com');
    });

    it('should throw an error if PORT is out of range', () => {
      jest.spyOn(configService, 'get').mockReturnValue(70000);
      expect(() => service.get('PORT')).toThrowError();
    });

    it('should log warnings for optional fields', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      jest.spyOn(configService, 'get').mockReturnValue('invalid_value');
      service.get('LOGGER_IS_BUFFER_ENABLED');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });    
  });
});
