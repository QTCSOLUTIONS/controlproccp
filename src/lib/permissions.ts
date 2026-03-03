import { Person, AuditEntity } from '../../types';

export const ROLES = {
    ADMIN: 'Admin',
    AUDIT_MANAGER: 'Audit Manager',
    LEAD_AUDITOR: 'Lead Auditor',
    SENIOR_STAFF: 'Senior Staff',
    AUDITOR: 'Auditor'
};

/**
 * Checks if a user has one of the specified roles.
 */
export const hasRole = (user: Person | null, allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
};

/**
 * Determines if the current user can create new entities.
 * Only Admins and Audit Managers can create entities.
 */
export const canCreateEntity = (user: Person | null): boolean => {
    return hasRole(user, [ROLES.ADMIN, ROLES.AUDIT_MANAGER]);
};

/**
 * Determines if the current user can edit a specific entity.
 * Admins and Managers can edit everything.
 * Auditors can only edit entities they are responsible for.
 */
export const canEditEntity = (user: Person | null, entity: AuditEntity): boolean => {
    if (!user) return false;

    // Admins and Managers can edit everything
    if (hasRole(user, [ROLES.ADMIN, ROLES.AUDIT_MANAGER])) {
        return true;
    }

    // Auditors can only edit if they are the responsible person
    if (user.role === ROLES.AUDITOR || user.role === ROLES.SENIOR_STAFF || user.role === ROLES.LEAD_AUDITOR) {
        return entity.responsible_id === user.id;
    }

    return false;
};

/**
 * Determines if the current user can delete an entity.
 * Only Admins and Audit Managers can delete entities.
 */
export const canDeleteEntity = (user: Person | null): boolean => {
    return hasRole(user, [ROLES.ADMIN, ROLES.AUDIT_MANAGER]);
};
