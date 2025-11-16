# from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import HttpResponseNotFound
from django.http import QueryDict
from .serializers import UserSerializer, ClassSerialzer
from .serializers import AssignmentSerializer, AssignmentGroupSerializer
from .serializers import SubmissionSerializer, CommentSerializer, SubmissionFileSerializer
from .models import User, Class, Assignment, AssignmentGroup, AssignmentSubmission, AssignmentSubmissionComment, AssignmentSubmissionFile

# Create your views here.

class UserView(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def list(self, request):
        email = request.GET.get('email', None)
        if email is not None:
            try:
                user = User.objects.get(email=email)
                serializer = UserSerializer(user)
                return Response(serializer.data)
            except User.DoesNotExist:
                return HttpResponseNotFound(f"User not found")
        else:
            users = User.objects.all()
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data)


class ClassView(viewsets.ModelViewSet):
    serializer_class = ClassSerialzer
    queryset = Class.objects.all()

    def list(self, request):
        teacher = request.GET.get('teacher', None)
        student = request.GET.get('student', None)
        if teacher is not None:
            # list classes for given teacher: api/classes/?teacher=<id>
            queryset = self.queryset.filter(teacher__id=teacher)
            serializer = ClassSerialzer(queryset, many=True)
            return Response(serializer.data)
        elif student is not None:
            # list classes for given student: api/classes/?student=<id>
            queryset = self.queryset.filter(students__id=student)
            serializer = ClassSerialzer(queryset, many=True)
            return Response(serializer.data)
        else:
            return HttpResponseNotFound(f"Class(es) not found")

    @action(detail=True)
    def assignments(self, request, pk=None):
        # list assignments for given class: api/classes/<id>/assignments
        queryset = Assignment.objects.filter(course__id=pk)
        serializer = AssignmentSerializer(queryset, many=True)
        return Response(serializer.data)

class AssignmentView(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    queryset = Assignment.objects.all()

    @action(detail=True)
    def groups(self, request, pk=None):
        student = request.GET.get('student', None)
        # list groups for given assignment: api/assignments/<id>/groups
        if student is not None:
            queryset = AssignmentGroup.objects.filter(assignment__id=pk)
            queryset = queryset.filter(users__in=[student])
            serializer = AssignmentGroupSerializer(queryset, many=True)
            return Response(serializer.data)
        else:
            queryset = AssignmentGroup.objects.filter(assignment__id=pk)
            serializer = AssignmentGroupSerializer(queryset, many=True)
            return Response(serializer.data)

    @action(detail=True)
    def submissions(self, request, pk=None):
        # list submissions for given assignment: api/assignments/<id>/submissions
        student = request.GET.get('student', None)
        current = True if request.GET.get('current', "").lower() in ('true', 'yes') else False
        if student is None:
            # list all submissions for assignment: api/assignments/<id>/submissions
            queryset = AssignmentSubmission.objects.filter(assignment__id=pk)
            serializer = SubmissionSerializer(queryset, many=True)
            return Response(serializer.data)
        elif not current:
            # list assignment submissions for given student: api/assignments/<id>/submissions/?student=<id>
            queryset = AssignmentSubmission.objects.filter(assignment__id=pk, user__id=student)
            serializer = SubmissionSerializer(queryset, many=True)
            return Response(serializer.data)
        else:
            # show current assignment submission for given student: api/assignments/<id>/submissions/?student=<id>&current=true
            queryset = AssignmentSubmission.objects.filter(assignment__id=pk, user__id=student, is_current=True)
            serializer = SubmissionSerializer(queryset, many=True)
            return Response(serializer.data)

class SubmissionView(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    queryset = AssignmentSubmission.objects.all()

class CommentsView(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    queryset = AssignmentSubmissionComment.objects.all()

class SubmissionFileView(viewsets.ModelViewSet):
    serializer_class = SubmissionFileSerializer
    queryset = AssignmentSubmissionFile.objects.all()

class AssignmentGroupView(viewsets.ModelViewSet):
    serializer_class = AssignmentGroupSerializer
    queryset = AssignmentGroup.objects.all()




