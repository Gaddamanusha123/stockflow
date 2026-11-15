from rest_framework import permissions

class HasOrganizationPermission(permissions.BasePermission):
    """
    Ensures that the user is authenticated and has an assigned organization.
    """
    message = "User is not associated with any organization."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.organization_id is not None
        )

    def has_object_permission(self, request, view, obj):
        # Ensure object belongs to the user's organization
        if hasattr(obj, 'organization'):
            return obj.organization_id == request.user.organization_id
        if hasattr(obj, 'organization_id'):
            return obj.organization_id == request.user.organization_id
        return True
