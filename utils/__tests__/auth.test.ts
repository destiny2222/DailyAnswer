import { getUserProfile, canAccessPremiumContent, isAuthenticated } from '../auth';
import { apiRequest } from '../api';
import * as SecureStore from 'expo-secure-store';

// Mock apiRequest
jest.mock('../api', () => ({
  apiRequest: jest.fn(),
}));

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Platform, AppState, and Appearance
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform.OS = 'ios';
  RN.AppState = {
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  };
  RN.Appearance = {
    getColorScheme: jest.fn().mockReturnValue('light'),
    addChangeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  };
  return RN;
});

// Mock expo-iap listeners
jest.mock('expo-iap', () => ({
  purchaseUpdatedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  purchaseErrorListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  finishTransaction: jest.fn(),
}));

describe('Auth Utilities & Caching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getUserProfile should cache profile and not request backend repeatedly within TTL', async () => {
    const mockProfile = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      has_paid: true,
      payment_status: 'active',
      payment_date: null,
      payment_expires_at: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
    };

    (apiRequest as jest.Mock).mockResolvedValue({ success: true, data: mockProfile });

    // First call (triggers backend)
    const profile1 = await getUserProfile(true); // forceRefresh=true
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(profile1).toEqual(mockProfile);

    // Second call within TTL (uses cache, doesn't request backend)
    const profile2 = await getUserProfile(false);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(profile2).toEqual(mockProfile);
  });

  it('canAccessPremiumContent should allow access if user has paid', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid_token');
    
    const mockProfile = {
      id: '1',
      name: 'Paid User',
      email: 'paid@example.com',
      has_paid: true,
      payment_expires_at: null,
    };
    (apiRequest as jest.Mock).mockResolvedValue({ success: true, data: mockProfile });

    const result = await canAccessPremiumContent();
    expect(result.isAuthenticated).toBe(true);
    expect(result.hasSubscription).toBe(true);
    expect(result.canAccess).toBe(true);
  });

  it('canAccessPremiumContent should restrict access if user has not paid', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('valid_token');
    
    const mockProfile = {
      id: '2',
      name: 'Free User',
      email: 'free@example.com',
      has_paid: false,
      payment_expires_at: null,
    };
    (apiRequest as jest.Mock).mockResolvedValue({ success: true, data: mockProfile });

    const result = await canAccessPremiumContent();
    expect(result.isAuthenticated).toBe(true);
    expect(result.hasSubscription).toBe(false);
    expect(result.canAccess).toBe(false);
  });
});
