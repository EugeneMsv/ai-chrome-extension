// Domain Blocker Service - Domain Layer
// Manages blocked domains for the extension

import { StorageService } from '@infrastructure/chrome-apis/storage.service';

const BLOCKED_DOMAINS_KEY = 'blockedDomains';

/**
 * Domain Blocker Service - Manages domain blocking functionality
 */
export class DomainBlockerService {
  private readonly storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Get all blocked domains
   */
  public async getBlockedDomains(): Promise<string[]> {
    try {
      const blockedDomains = await this.storageService.get<string[]>(BLOCKED_DOMAINS_KEY);
      return blockedDomains || [];
    } catch (error) {
      console.error('DomainBlockerService: Error getting blocked domains:', error);
      return [];
    }
  }

  /**
   * Add a domain to blocked list
   */
  public async addBlockedDomain(domain: string): Promise<void> {
    try {
      const blockedDomains = await this.getBlockedDomains();
      if (!blockedDomains.includes(domain)) {
        blockedDomains.push(domain);
        await this.storageService.set(BLOCKED_DOMAINS_KEY, blockedDomains);
      }
    } catch (error) {
      console.error('DomainBlockerService: Error adding blocked domain:', error);
      throw error;
    }
  }

  /**
   * Remove a domain from blocked list
   */
  public async removeBlockedDomain(domain: string): Promise<void> {
    try {
      const blockedDomains = await this.getBlockedDomains();
      const updatedDomains = blockedDomains.filter(d => d !== domain);
      await this.storageService.set(BLOCKED_DOMAINS_KEY, updatedDomains);
    } catch (error) {
      console.error('DomainBlockerService: Error removing blocked domain:', error);
      throw error;
    }
  }

  /**
   * Check if a domain is blocked
   */
  public async isDomainBlocked(domain: string): Promise<boolean> {
    try {
      const blockedDomains = await this.getBlockedDomains();
      return blockedDomains.includes(domain);
    } catch (error) {
      console.error('DomainBlockerService: Error checking domain blocked status:', error);
      return false;
    }
  }

  /**
   * Update entire blocked domains list
   */
  public async updateBlockedDomains(domains: string[]): Promise<void> {
    try {
      await this.storageService.set(BLOCKED_DOMAINS_KEY, domains);
    } catch (error) {
      console.error('DomainBlockerService: Error updating blocked domains:', error);
      throw error;
    }
  }
}
