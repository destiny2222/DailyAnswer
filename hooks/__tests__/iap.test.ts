import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAppleIAP } from '../useAppleIAP';

// 1. Mock Platform and Appearance
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform.OS = 'ios';
  RN.Platform.select = jest.fn().mockImplementation((obj) => obj.ios);
  RN.Appearance = {
    getColorScheme: jest.fn().mockReturnValue('light'),
    addChangeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  };
  return RN;
});

// 2. Mock expo-iap
const mockInitConnection = jest.fn();
const mockEndConnection = jest.fn().mockResolvedValue(true);
const mockFetchProducts = jest.fn();
const mockRequestPurchase = jest.fn();
const mockRestorePurchases = jest.fn();

jest.mock('expo-iap', () => ({
  initConnection: () => mockInitConnection(),
  endConnection: () => mockEndConnection(),
  fetchProducts: (args: any) => mockFetchProducts(args),
  requestPurchase: (args: any) => mockRequestPurchase(args),
  restorePurchases: () => mockRestorePurchases(),
}));

// 3. Mock apiRequest from api.ts
const mockApiRequest = jest.fn();
jest.mock('../../utils/api', () => ({
  apiRequest: (path: string, options: any) => mockApiRequest(path, options),
}));

describe('useAppleIAP Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize connection and fetch products on mount', async () => {
    mockInitConnection.mockResolvedValue(true);
    mockFetchProducts.mockResolvedValue([
      { id: 'com.thedailyanswer.monthly', displayPrice: '$9.99', title: 'Daily Answer Premium' }
    ]);

    const { result } = renderHook(() => useAppleIAP());

    await waitFor(() => {
      expect(result.current.product).not.toBeNull();
    });

    expect(mockInitConnection).toHaveBeenCalled();
    expect(mockFetchProducts).toHaveBeenCalledWith({
      skus: ['com.thedailyanswer.monthly'],
      type: 'subs',
    });
    expect(result.current.product).toEqual({
      id: 'com.thedailyanswer.monthly',
      displayPrice: '$9.99',
      title: 'Daily Answer Premium',
    });
    expect(result.current.error).toBeNull();
  });

  it('should set error state if connection fails', async () => {
    mockInitConnection.mockResolvedValue(false);

    const { result } = renderHook(() => useAppleIAP());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error).toContain('Failed to connect');
    expect(result.current.product).toBeNull();
  });

  it('should trigger requestPurchase when subscribe is called', async () => {
    mockInitConnection.mockResolvedValue(true);
    mockFetchProducts.mockResolvedValue([]);
    mockRequestPurchase.mockResolvedValue({ id: 'tx_123', productId: 'com.thedailyanswer.monthly' });

    const { result } = renderHook(() => useAppleIAP());

    await act(async () => {
      await result.current.subscribe().catch(() => { });
    });

    expect(mockRequestPurchase).toHaveBeenCalledWith({
      request: {
        apple: {
          sku: 'com.thedailyanswer.monthly',
        },
      },
      type: 'subs',
    });
  });

  it('should trigger restorePurchases when restore is called', async () => {
    mockInitConnection.mockResolvedValue(true);
    mockFetchProducts.mockResolvedValue([]);
    mockRestorePurchases.mockResolvedValue(true);

    const { result } = renderHook(() => useAppleIAP());

    await act(async () => {
      await result.current.restore().catch(() => { });
    });

    expect(mockRestorePurchases).toHaveBeenCalled();
  });
});
