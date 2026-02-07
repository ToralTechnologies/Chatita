/**
 * LibreLinkUp API Client
 * Unofficial API for FreeStyle Libre CGM data via LibreLinkUp
 * Based on: https://github.com/DiaKEM/libre-link-up-api-client
 */

interface LibreAuthResponse {
  status: number;
  data: {
    user: {
      id: string;
      email: string;
      country: string;
    };
    authTicket: {
      token: string;
      expires: number;
      duration: number;
    };
  };
}

interface LibreConnection {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  targetLow: number;
  targetHigh: number;
}

interface LibreGlucoseMeasurement {
  FactoryTimestamp: string;
  Timestamp: string;
  type: number;
  ValueInMgPerDl: number;
  TrendArrow: number;
  TrendMessage: string;
  MeasurementColor: number;
  GlucoseUnits: number;
  Value: number;
  isHigh: boolean;
  isLow: boolean;
}

interface LibreGraphData {
  connection: LibreConnection;
  activeSensors: any[];
  graphData: LibreGlucoseMeasurement[];
}

// API Base URLs by region
const LIBRE_API_URLS = {
  US: 'https://api.libreview.io',
  EU: 'https://api-eu.libreview.io',
  AP: 'https://api-ap.libreview.io',
};

const LIBRE_HEADERS = {
  'accept-encoding': 'gzip',
  'cache-control': 'no-cache',
  connection: 'Keep-Alive',
  'content-type': 'application/json',
  product: 'llu.android',
  version: '4.7.0',
};

export class LibreLinkUpClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(region: 'US' | 'EU' | 'AP' = 'US') {
    this.baseUrl = LIBRE_API_URLS[region];
  }

  /**
   * Authenticate with LibreLinkUp
   */
  async login(email: string, password: string): Promise<{
    token: string;
    expires: Date;
    patientId?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/llu/auth/login`, {
        method: 'POST',
        headers: LIBRE_HEADERS,
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `LibreLinkUp login failed: ${response.status} - ${errorText}`
        );
      }

      const data: LibreAuthResponse = await response.json();

      if (data.status !== 0) {
        throw new Error('LibreLinkUp login failed: Invalid credentials');
      }

      this.authToken = data.data.authTicket.token;
      const expiresAt = new Date(Date.now() + data.data.authTicket.duration * 1000);

      // Get patient connections
      const connections = await this.getConnections(this.authToken);
      const patientId = connections.length > 0 ? connections[0].patientId : undefined;

      return {
        token: this.authToken,
        expires: expiresAt,
        patientId,
      };
    } catch (error) {
      console.error('LibreLinkUp login error:', error);
      throw error;
    }
  }

  /**
   * Get patient connections (people you're following)
   */
  async getConnections(authToken?: string): Promise<LibreConnection[]> {
    const token = authToken || this.authToken;
    if (!token) {
      throw new Error('Not authenticated. Call login() first.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/llu/connections`, {
        method: 'GET',
        headers: {
          ...LIBRE_HEADERS,
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get connections: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 0) {
        throw new Error('Failed to get connections');
      }

      return data.data || [];
    } catch (error) {
      console.error('LibreLinkUp getConnections error:', error);
      throw error;
    }
  }

  /**
   * Get glucose graph data for a patient (last 12 hours)
   */
  async getGlucoseData(
    patientId: string,
    authToken?: string
  ): Promise<LibreGlucoseMeasurement[]> {
    const token = authToken || this.authToken;
    if (!token) {
      throw new Error('Not authenticated. Call login() first.');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/llu/connections/${patientId}/graph`,
        {
          method: 'GET',
          headers: {
            ...LIBRE_HEADERS,
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error(`Failed to get glucose data: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 0) {
        throw new Error('Failed to get glucose data');
      }

      const graphData: LibreGraphData = data.data;
      return graphData.graphData || [];
    } catch (error) {
      console.error('LibreLinkUp getGlucoseData error:', error);
      throw error;
    }
  }

  /**
   * Get current (most recent) glucose reading
   */
  async getCurrentGlucose(
    patientId: string,
    authToken?: string
  ): Promise<LibreGlucoseMeasurement | null> {
    const readings = await this.getGlucoseData(patientId, authToken);

    if (readings.length === 0) {
      return null;
    }

    // Sort by timestamp (most recent first)
    readings.sort(
      (a, b) =>
        new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
    );

    return readings[0];
  }

  /**
   * Convert trend arrow number to symbol
   */
  static getTrendSymbol(trendArrow: number): string {
    const trendMap: Record<number, string> = {
      1: '↑', // Rising rapidly
      2: '↗', // Rising
      3: '→', // Stable
      4: '↘', // Falling
      5: '↓', // Falling rapidly
    };
    return trendMap[trendArrow] || '→';
  }
}

/**
 * Encrypt password for storage (simple Base64 - in production use proper encryption)
 */
export function encryptPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

/**
 * Decrypt password from storage
 */
export function decryptPassword(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}
