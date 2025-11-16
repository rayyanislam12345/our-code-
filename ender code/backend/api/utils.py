"""Utility functions for deadline extension and access control logic."""

from django.utils import timezone
from .models import Assignment, AssignmentDeadlineExtension, User


def get_effective_deadline(assignment, user=None):
    """Get the effective submission deadline for a user on an assignment.
    
    Returns the latest applicable deadline considering:
    1. Personal extension (highest priority)
    2. Class-wide extension
    3. Original assignment deadline
    
    Args:
        assignment: Assignment instance
        user: User instance or user ID (optional)
    
    Returns:
        datetime: The effective deadline
    """
    user_id = user.id if isinstance(user, User) else user
    
    # Check for personal extension first
    if user_id:
        personal_ext = AssignmentDeadlineExtension.objects.filter(
            assignment=assignment, user_id=user_id
        ).first()
        if personal_ext:
            return personal_ext.extended_submission_deadline
    
    # Check for class-wide extension
    classwide_ext = AssignmentDeadlineExtension.objects.filter(
        assignment=assignment, user__isnull=True
    ).first()
    if classwide_ext:
        return classwide_ext.extended_submission_deadline
    
    # Return original deadline
    return assignment.submission_deadline


def should_restrict_submission_access(assignment, requester, target_user=None):
    """Determine if a student's access to submissions should be restricted.
    
    Students with active personal extensions cannot see other submissions until
    both the assignment deadline AND any class-wide extension have passed.
    
    Args:
        assignment: Assignment instance or assignment ID
        requester: User instance or user ID making the request
        target_user: User instance or user ID being accessed (None = all submissions)
    
    Returns:
        bool: True if access should be restricted
    """
    if isinstance(assignment, (int, str)):
        assignment = Assignment.objects.get(id=assignment)
    
    requester_id = requester.id if isinstance(requester, User) else requester
    target_id = target_user.id if isinstance(target_user, User) else target_user
    
    # Teachers always have access
    try:
        requester_obj = User.objects.get(id=requester_id)
        if requester_obj.is_teacher:
            return False
    except User.DoesNotExist:
        return False
    
    # Students can always view their own submissions
    if target_id and str(requester_id) == str(target_id):
        return False
    
    now = timezone.now()
    
    # Check for personal extension
    personal_ext = AssignmentDeadlineExtension.objects.filter(
        assignment=assignment, user_id=requester_id
    ).first()
    
    has_active_personal_ext = (
        personal_ext is not None and 
        personal_ext.extended_submission_deadline > now
    )
    
    # No personal extension = no restriction
    if not has_active_personal_ext:
        return False
    
    # Check if both assignment deadline and class-wide extension have passed
    assignment_deadline_passed = assignment.submission_deadline <= now
    
    classwide_ext = AssignmentDeadlineExtension.objects.filter(
        assignment=assignment, user__isnull=True
    ).first()
    
    classwide_deadline_passed = True
    if classwide_ext:
        classwide_deadline_passed = classwide_ext.extended_submission_deadline <= now
    
    # Restrict if:
    # - Has active personal extension AND
    # - Both assignment and class-wide deadlines have passed
    return assignment_deadline_passed and classwide_deadline_passed


def has_active_extension(assignment, user):
    """Check if a user has an active deadline extension.
    
    Args:
        assignment: Assignment instance or assignment ID
        user: User instance or user ID
    
    Returns:
        bool: True if user has an active personal or class-wide extension
    """
    if isinstance(assignment, (int, str)):
        assignment = Assignment.objects.get(id=assignment)
    
    user_id = user.id if isinstance(user, User) else user
    now = timezone.now()
    
    # Check personal extension
    personal_ext = AssignmentDeadlineExtension.objects.filter(
        assignment=assignment, user_id=user_id
    ).first()
    if personal_ext and personal_ext.extended_submission_deadline > now:
        return True
    
    # Check class-wide extension
    classwide_ext = AssignmentDeadlineExtension.objects.filter(
        assignment=assignment, user__isnull=True
    ).first()
    if classwide_ext and classwide_ext.extended_submission_deadline > now:
        return True
    
    return False


def is_past_deadline(assignment, user=None):
    """Check if the effective deadline has passed for a user.
    
    Args:
        assignment: Assignment instance
        user: User instance or user ID (optional)
    
    Returns:
        bool: True if past the effective deadline
    """
    effective_deadline = get_effective_deadline(assignment, user)
    return timezone.now() > effective_deadline
