export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessContext {
  userId: string;
  userRole: string;
  resource: string;
  action: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export class RBACService {
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private userRoles: Map<string, string[]> = new Map();

  constructor() {
    this.initializeSystemRoles();
  }

  /**
   * Check if user has permission to perform action on resource
   */
  async hasPermission(context: AccessContext): Promise<boolean> {
    const userRoles = this.getUserRoles(context.userId);

    for (const roleName of userRoles) {
      const role = this.roles.get(roleName);
      if (!role) continue;

      for (const permission of role.permissions) {
        if (this.matchesPermission(permission, context)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check multiple permissions at once
   */
  async hasAnyPermission(contexts: AccessContext[]): Promise<boolean> {
    for (const context of contexts) {
      if (await this.hasPermission(context)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = this.getUserRoles(userId);
    const permissions = new Set<Permission>();

    for (const roleName of userRoles) {
      const role = this.roles.get(roleName);
      if (role) {
        role.permissions.forEach(p => permissions.add(p));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleName: string): Promise<void> {
    const role = this.roles.get(roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const userRoles = this.getUserRoles(userId);
    if (!userRoles.includes(roleName)) {
      userRoles.push(roleName);
      this.userRoles.set(userId, userRoles);
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleName: string): Promise<void> {
    const userRoles = this.getUserRoles(userId);
    const index = userRoles.indexOf(roleName);
    if (index > -1) {
      userRoles.splice(index, 1);
      this.userRoles.set(userId, userRoles);
    }
  }

  /**
   * Create custom role
   */
  async createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const role: Role = {
      id: this.generateId(),
      ...roleData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set(role.name, role);
    return role;
  }

  /**
   * Create custom permission
   */
  async createPermission(permissionData: Omit<Permission, 'id'>): Promise<Permission> {
    const permission: Permission = {
      id: this.generateId(),
      ...permissionData,
    };

    this.permissions.set(permission.name, permission);
    return permission;
  }

  private getUserRoles(userId: string): string[] {
    return this.userRoles.get(userId) || ['user'];
  }

  private matchesPermission(permission: Permission, context: AccessContext): boolean {
    // Check resource match
    if (permission.resource !== '*' && permission.resource !== context.resource) {
      return false;
    }

    // Check action match
    if (permission.action !== '*' && permission.action !== context.action) {
      return false;
    }

    // Check conditions if any
    if (permission.conditions) {
      return this.evaluateConditions(permission.conditions, context);
    }

    return true;
  }

  private evaluateConditions(conditions: Record<string, any>, context: AccessContext): boolean {
    // Resource owner check
    if (conditions.owner && context.metadata?.ownerId) {
      return context.metadata.ownerId === context.userId;
    }

    // Plugin category restrictions
    if (conditions.categories && context.metadata?.category) {
      return conditions.categories.includes(context.metadata.category);
    }

    // Time-based access
    if (conditions.timeRestrictions) {
      const now = new Date();
      const { startTime, endTime } = conditions.timeRestrictions;
      if (startTime && now < new Date(startTime)) return false;
      if (endTime && now > new Date(endTime)) return false;
    }

    return true;
  }

  private initializeSystemRoles(): void {
    // User role
    const userPermissions: Permission[] = [
      {
        id: '1',
        name: 'plugin:install',
        description: 'Install plugins',
        resource: 'plugin',
        action: 'install',
      },
      {
        id: '2',
        name: 'plugin:uninstall',
        description: 'Uninstall plugins',
        resource: 'plugin',
        action: 'uninstall',
      },
      {
        id: '3',
        name: 'plugin:review',
        description: 'Review plugins',
        resource: 'plugin',
        action: 'review',
      },
      {
        id: '4',
        name: 'order:create',
        description: 'Create orders',
        resource: 'order',
        action: 'create',
      },
      {
        id: '5',
        name: 'profile:read',
        description: 'Read own profile',
        resource: 'profile',
        action: 'read',
        conditions: { owner: true },
      },
      {
        id: '6',
        name: 'profile:update',
        description: 'Update own profile',
        resource: 'profile',
        action: 'update',
        conditions: { owner: true },
      },
    ];

    // Developer role
    const developerPermissions: Permission[] = [
      ...userPermissions,
      {
        id: '7',
        name: 'plugin:create',
        description: 'Create plugins',
        resource: 'plugin',
        action: 'create',
      },
      {
        id: '8',
        name: 'plugin:update',
        description: 'Update own plugins',
        resource: 'plugin',
        action: 'update',
        conditions: { owner: true },
      },
      {
        id: '9',
        name: 'plugin:publish',
        description: 'Publish own plugins',
        resource: 'plugin',
        action: 'publish',
        conditions: { owner: true },
      },
      {
        id: '10',
        name: 'earnings:read',
        description: 'Read earnings',
        resource: 'earnings',
        action: 'read',
        conditions: { owner: true },
      },
      {
        id: '11',
        name: 'analytics:plugin',
        description: 'View plugin analytics',
        resource: 'analytics',
        action: 'read',
        conditions: { owner: true },
      },
    ];

    // Moderator role
    const moderatorPermissions: Permission[] = [
      ...userPermissions,
      {
        id: '12',
        name: 'plugin:moderate',
        description: 'Moderate plugins',
        resource: 'plugin',
        action: 'moderate',
      },
      {
        id: '13',
        name: 'user:moderate',
        description: 'Moderate users',
        resource: 'user',
        action: 'moderate',
      },
      {
        id: '14',
        name: 'review:moderate',
        description: 'Moderate reviews',
        resource: 'review',
        action: 'moderate',
      },
      {
        id: '15',
        name: 'report:view',
        description: 'View reports',
        resource: 'report',
        action: 'read',
      },
    ];

    // Admin role
    const adminPermissions: Permission[] = [
      { id: '16', name: 'admin:all', description: 'Full admin access', resource: '*', action: '*' },
    ];

    // Create system roles
    this.roles.set('user', {
      id: 'role_user',
      name: 'user',
      description: 'Regular platform user',
      permissions: userPermissions,
      isSystemRole: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.roles.set('developer', {
      id: 'role_developer',
      name: 'developer',
      description: 'Plugin developer',
      permissions: developerPermissions,
      isSystemRole: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.roles.set('moderator', {
      id: 'role_moderator',
      name: 'moderator',
      description: 'Content moderator',
      permissions: moderatorPermissions,
      isSystemRole: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.roles.set('admin', {
      id: 'role_admin',
      name: 'admin',
      description: 'System administrator',
      permissions: adminPermissions,
      isSystemRole: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Store all permissions
    [
      ...userPermissions,
      ...developerPermissions,
      ...moderatorPermissions,
      ...adminPermissions,
    ].forEach(p => this.permissions.set(p.name, p));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const rbacService = new RBACService();
