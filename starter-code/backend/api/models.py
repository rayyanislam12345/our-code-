from django.db import models
from django.utils import timezone

# Create your models here.
class User(models.Model):
    is_teacher = models.BooleanField(default=False)
    #profile_pic = models.TextField(default="")
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    #google_oauth_token = models.TextField(default="")

    def __str__(self):
        return self.name


class Class(models.Model):
    code = models.CharField(max_length=16)
    name = models.CharField(max_length=255)
    term = models.CharField(max_length=16)
    year = models.PositiveSmallIntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_class_set')
    students = models.ManyToManyField(User, related_name='student_class_set')

    def __str__(self):
        return f"{self.code} {self.name} {self.term}"


class Assignment(models.Model):
    course = models.ForeignKey(Class, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField()
    release_date = models.DateTimeField()
    submission_deadline = models.DateTimeField()
    commenting_deadline = models.DateTimeField()

    def __str__(self):
        return self.name


class AssignmentGroup(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    users = models.ManyToManyField(User)

    def __str__(self):
        return f"Assignment Group {self.id}"


class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    submitted_at = models.DateTimeField(default=timezone.now)
    is_current = models.BooleanField()
    submitter_has_reviewed_comments = models.BooleanField(default=False)

    def __str__(self):
        return f"Submission for assignment {self.assignment_id} by user {self.user_id}"


class AssignmentSubmissionFile(models.Model):
    name = models.CharField(max_length=255)
    submission = models.ForeignKey(AssignmentSubmission, related_name='files', on_delete=models.CASCADE)
    content = models.TextField()
    #content = models.BinaryField(editable=True)

    def __str__(self):
        return f"File {self.name} attached to submission {self.submission}"


class AssignmentSubmissionComment(models.Model):
    submission = models.ForeignKey(AssignmentSubmission, related_name='comments', on_delete=models.CASCADE)
    
    type_choices = [
        ('linter', 'Linter'),
        ('file', 'File'),
        ('general', 'General'),
    ]
    comment_type = models.CharField(max_length=10, choices=type_choices)
    submission_file = models.ForeignKey(AssignmentSubmissionFile, on_delete=models.CASCADE, null=True)

    # NEW fields for precise range
    start_line = models.IntegerField()
    end_line = models.IntegerField()
    start_offset = models.IntegerField()
    end_offset = models.IntegerField()

    # NEW field for comment threading
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='replies'
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.TextField()

    def __str__(self):
        return f"Comment on submission {self.submission_id}"

