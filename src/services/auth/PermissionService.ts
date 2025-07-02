import { UserRole } from './AuthService';

export interface Permission {
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'owner' | 'role_hierarchy';
  value: any;
}

export interface PermissionContext {
  userId: string;
  userRole: UserRole;
  resourceId?: string;
  resourceOwnerId?: string;
  additionalData?: Record<string, any>;
}

export class PermissionService {
  private readonly roleHierarchy: Record<UserRole, number> = {
    [UserRole.USER]: 1,
    [UserRole.DEVELOPER]: 2,
    [UserRole.MODERATOR]: 3,
    [UserRole.ADMIN]: 4,
  };

  private readonly permissions: Record<UserRole, Permission[]> = {
    [UserRole.USER]: [
      { resource: 'plugin', action: 'read' },
      { resource: 'plugin', action: 'install' },
      {
        resource: 'plugin',
        action: 'uninstall',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      {
        resource: 'plugin',
        action: 'review',
        conditions: [{ field: 'status', operator: 'equals', value: 'published' }],
      },
      {
        resource: 'profile',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      {
        resource: 'profile',
        action: 'update',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      { resource: 'order', action: 'create' },
      {
        resource: 'order',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      {
        resource: 'analytics',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
    ],

    [UserRole.DEVELOPER]: [
      { resource: 'plugin', action: 'read' },
      { resource: 'plugin', action: 'create' },
      {
        resource: 'plugin',
        action: 'update',
        conditions: [{ field: 'authorId', operator: 'owner', value: null }],
      },
      {
        resource: 'plugin',
        action: 'delete',
        conditions: [{ field: 'authorId', operator: 'owner', value: null }],
      },
      {
        resource: 'plugin',
        action: 'publish',
        conditions: [{ field: 'authorId', operator: 'owner', value: null }],
      },
      { resource: 'plugin', action: 'install' },
      {
        resource: 'plugin',
        action: 'uninstall',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      {
        resource: 'plugin',
        action: 'review',
        conditions: [{ field: 'status', operator: 'equals', value: 'published' }],
      },
      {
        resource: 'profile',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      {
        resource: 'profile',
        action: 'update',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      { resource: 'order', action: 'create' },
      {
        resource: 'order',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      {
        resource: 'earnings',
        action: 'read',
        conditions: [{ field: 'developerId', operator: 'owner', value: null }],
      },
      {
        resource: 'analytics',
        action: 'read',
        conditions: [{ field: 'authorId', operator: 'owner', value: null }],
      },
    ],

    [UserRole.MODERATOR]: [
      { resource: 'plugin', action: 'read' },
      { resource: 'plugin', action: 'moderate' },
      { resource: 'plugin', action: 'approve' },
      { resource: 'plugin', action: 'reject' },
      { resource: 'plugin', action: 'suspend' },
      { resource: 'plugin', action: 'install' },
      {
        resource: 'plugin',
        action: 'uninstall',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      { resource: 'plugin', action: 'review' },
      { resource: 'user', action: 'read' },
      { resource: 'user', action: 'moderate' },
      {
        resource: 'user',
        action: 'suspend',
        conditions: [{ field: 'role', operator: 'role_hierarchy', value: 'lower' }],
      },
      { resource: 'review', action: 'read' },
      { resource: 'review', action: 'moderate' },
      { resource: 'review', action: 'hide' },
      { resource: 'review', action: 'flag' },
      {
        resource: 'profile',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      {
        resource: 'profile',
        action: 'update',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      { resource: 'order', action: 'create' },
      {
        resource: 'order',
        action: 'read',
        conditions: [{ field: 'userId', operator: 'owner', value: null }],
      },
      {
        resource: 'analytics',
        action: 'read',
        conditions: [{ field: 'scope', operator: 'equals', value: 'moderation' }],
      },
    ],

    [UserRole.ADMIN]: [{ resource: '*', action: '*' }],
  };

  hasPermission(
    userRole: UserRole,
    resource: string,
    action: string,
    context?: PermissionContext
  ): boolean {
    const userPermissions = this.permissions[userRole] || [];

    // Check for wildcard admin permissions
    if (userPermissions.some(p => p.resource === '*' && p.action === '*')) {
      return true;
    }

    // Find matching permissions
    const matchingPermissions = userPermissions.filter(
      p =>
        (p.resource === resource || p.resource === '*') && (p.action === action || p.action === '*')
    );

    if (matchingPermissions.length === 0) {
      return false;
    }

    // Check conditions if context is provided
    if (context) {
      return matchingPermissions.some(permission =>
        this.checkConditions(permission.conditions || [], context)
      );
    }

    // If no context provided, allow permissions without conditions
    return matchingPermissions.some(
      permission => !permission.conditions || permission.conditions.length === 0
    );
  }

  hasAnyPermission(
    userRole: UserRole,
    permissions: Array<{ resource: string; action: string }>,
    context?: PermissionContext
  ): boolean {
    return permissions.some(({ resource, action }) =>
      this.hasPermission(userRole, resource, action, context)
    );
  }

  hasAllPermissions(
    userRole: UserRole,
    permissions: Array<{ resource: string; action: string }>,
    context?: PermissionContext
  ): boolean {
    return permissions.every(({ resource, action }) =>
      this.hasPermission(userRole, resource, action, context)
    );
  }

  getUserPermissions(userRole: UserRole): Permission[] {
    return this.permissions[userRole] || [];
  }

  getResourcePermissions(userRole: UserRole, resource: string): Permission[] {
    const userPermissions = this.getUserPermissions(userRole);
    return userPermissions.filter(p => p.resource === resource || p.resource === '*');
  }

  canAccessResource(userRole: UserRole, resource: string, context?: PermissionContext): boolean {
    return this.hasAnyPermission(
      userRole,
      [
        { resource, action: 'read' },
        { resource, action: 'create' },
        { resource, action: 'update' },
        { resource, action: 'delete' },
      ],
      context
    );
  }

  canModifyResource(userRole: UserRole, resource: string, context?: PermissionContext): boolean {
    return this.hasAnyPermission(
      userRole,
      [
        { resource, action: 'create' },
        { resource, action: 'update' },
        { resource, action: 'delete' },
      ],
      context
    );
  }

  getPermissionFilters(
    userRole: UserRole,
    resource: string,
    action: string
  ): PermissionCondition[] {
    const userPermissions = this.getUserPermissions(userRole);
    const matchingPermission = userPermissions.find(
      p =>
        (p.resource === resource || p.resource === '*') && (p.action === action || p.action === '*')
    );

    return matchingPermission?.conditions || [];
  }

  private checkConditions(conditions: PermissionCondition[], context: PermissionContext): boolean {
    return conditions.every(condition => this.checkCondition(condition, context));
  }

  private checkCondition(condition: PermissionCondition, context: PermissionContext): boolean {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'equals':
        return this.getFieldValue(field, context) === value;

      case 'not_equals':
        return this.getFieldValue(field, context) !== value;

      case 'in':
        return Array.isArray(value) && value.includes(this.getFieldValue(field, context));

      case 'not_in':
        return Array.isArray(value) && !value.includes(this.getFieldValue(field, context));

      case 'owner':
        if (field === 'userId') {
          return context.userId === context.resourceOwnerId;
        }
        if (field === 'authorId' || field === 'developerId') {
          return context.userId === context.resourceOwnerId;
        }
        return false;

      case 'role_hierarchy':
        if (value === 'lower') {
          const targetRole = this.getFieldValue(field, context) as UserRole;
          return this.roleHierarchy[context.userRole] > this.roleHierarchy[targetRole];
        }
        if (value === 'higher') {
          const targetRole = this.getFieldValue(field, context) as UserRole;
          return this.roleHierarchy[context.userRole] < this.roleHierarchy[targetRole];
        }
        return false;

      default:
        return false;
    }
  }

  private getFieldValue(field: string, context: PermissionContext): any {
    switch (field) {
      case 'userId':
        return context.userId;
      case 'userRole':
        return context.userRole;
      case 'resourceId':
        return context.resourceId;
      case 'resourceOwnerId':
      case 'authorId':
      case 'developerId':
        return context.resourceOwnerId;
      case 'role':
        return context.additionalData?.role;
      case 'status':
        return context.additionalData?.status;
      case 'scope':
        return context.additionalData?.scope;
      default:
        return context.additionalData?.[field];
    }
  }

  createPermissionContext(
    userId: string,
    userRole: UserRole,
    options: {
      resourceId?: string;
      resourceOwnerId?: string;
      additionalData?: Record<string, any>;
    } = {}
  ): PermissionContext {
    return {
      userId,
      userRole,
      ...options,
    };
  }
}

export const permissionService = new PermissionService();
