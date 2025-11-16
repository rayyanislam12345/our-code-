from rest_framework import serializers
from api.models import User, Class, Assignment, AssignmentSubmission, AssignmentGroup, AssignmentSubmissionComment, AssignmentSubmissionFile

#
# User
#

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'is_teacher')

#
# Class info
#

class ClassSerialzer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ('id', 'code', 'name', 'term', 'year', 'start_date', 'end_date', 'teacher')

#
# Assignment info
#

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ('id', 'course', 'name', 'description', 'release_date', 'submission_deadline', 'commenting_deadline')

class AssignmentGroupSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentGroup
        fields = ('id', 'assignment', 'users')

#
# Submission info
#

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmissionComment
        fields = (
            'id',
            'submission',
            'submission_file',
            'user',
            'comment',
            'start_line',
            'end_line',
            'start_offset',
            'end_offset',
            'parent',
        )


class SubmissionFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentSubmissionFile
        fields = ('id', 'name', 'submission', 'content')

class SubmissionSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    files = SubmissionFileSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
