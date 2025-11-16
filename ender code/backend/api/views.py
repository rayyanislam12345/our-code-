# from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import HttpResponseNotFound
from django.http import QueryDict
from .serializers import UserSerializer, ClassSerializer
from .serializers import ClassRosterSerializer
from .serializers import AssignmentSerializer, AssignmentGroupSerializer
from .serializers import SubmissionSerializer, CommentSerializer, SubmissionFileSerializer, AssignmentDeadlineExtensionSerializer
from .models import User, Class, Assignment, AssignmentGroup, AssignmentSubmission, AssignmentSubmissionComment, AssignmentSubmissionFile
from .models import AssignmentDeadlineExtension
from .utils import should_restrict_submission_access

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
    serializer_class = ClassSerializer
    queryset = Class.objects.all()

    def list(self, request):
        teacher = request.GET.get('teacher', None)
        student = request.GET.get('student', None)
        if teacher is not None:
            # list classes for given teacher: /api/classes?teacher=<id>
            queryset = self.queryset.filter(teacher__id=teacher)
            serializer = ClassSerializer(queryset, many=True)
            return Response(serializer.data)
        elif student is not None:
            # list classes for given student: /api/classes?student=<id>
            queryset = self.queryset.filter(students__id=student)
            serializer = ClassSerializer(queryset, many=True)
            return Response(serializer.data)
        else:
            return HttpResponseNotFound(f"Class(es) not found")

    @action(detail=True)
    def assignments(self, request, pk=None):
        # list assignments for given class: /api/classes/<id>/assignments
        queryset = Assignment.objects.filter(course__id=pk)
        serializer = AssignmentSerializer(queryset, many=True)
        return Response(serializer.data)

    # new fall 2025
    @action(detail=True, methods=['get', 'patch'])
    def roster(self, request, pk=None):
        if request.method == 'GET':
            # list students for given class: /api/classes/<id>/roster
            class_object = Class.objects.get(id=pk)
            queryset = class_object.students.all()
            serializer = UserSerializer(queryset, many=True)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            class_object = Class.objects.get(id=pk)
            if "student" in request.data and "action" in request.data and request.data.get("action") == "remove":
                # PATCH: remove student from class roster: api/classes/<id>/roster
                student_email = request.data.get('student', None)
                if student_email is not None:
                    try:
                        student = User.objects.get(email=student_email)
                        class_object.students.remove(student)
                        class_object.save()
                    except User.DoesNotExist:
                        return HttpResponseNotFound(f"User with email {student_email} not found")
            elif "student" in request.data:
                # PATCH: add student to class roster: api/classes/<id>/roster
                student_email = request.data.get('student', None)
                if student_email is not None:
                    try:
                        student = User.objects.get(email=student_email)
                    except User.DoesNotExist:
                        if student_email.endswith("@union.edu"):
                            User.objects.create(email=student_email, name=student_email.split('@')[0].capitalize(), is_teacher=False)
                            student = User.objects.get(email=student_email)
                        else:
                            return HttpResponseNotFound(f"Not an acceptable email address: {student_email}")
                    class_object.students.add(student)
                    class_object.save()
            elif "students" in request.data:
                # PATCH: add multiple students to class roster: /api/classes/<id>/roster
                student_emails = request.data.get('students', None)
                if student_emails is not None and isinstance(student_emails, list):
                    not_found = []
                    for email in student_emails:
                        try:
                            student = User.objects.get(email=email)
                        except User.DoesNotExist:
                            if email.endswith("@union.edu"):
                                User.objects.create(email=email, name=email.split('@')[0].capitalize(), is_teacher=False)
                                student = User.objects.get(email=email)
                            else:
                                not_found.append(email)
                                continue
                        class_object.students.add(student)
                    class_object.save()
                    if len(not_found) > 0:
                        return Response({"status": "partial", "not_found": not_found})
            queryset = class_object.students.all()
            serializer = UserSerializer(queryset, many=True)
            return Response(serializer.data)


class AssignmentView(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    queryset = Assignment.objects.all()

    @action(detail=True, methods=['get', 'post'])
    def groups(self, request, pk=None):
        if request.method == 'GET':
            student = request.GET.get('student', None)
            # list groups for given assignment: /api/assignments/<id>/groups
            if student is not None:
                queryset = AssignmentGroup.objects.filter(assignment__id=pk)
                queryset = queryset.filter(users__in=[student])
                serializer = AssignmentGroupSerializer(queryset, many=True)
                return Response(serializer.data)
            else:
                queryset = AssignmentGroup.objects.filter(assignment__id=pk)
                serializer = AssignmentGroupSerializer(queryset, many=True)
                return Response(serializer.data)
        elif request.method == 'POST':  # new fall 2025
            # create new group for given assignment: /api/assignments/<id>/groups
            assignment = Assignment.objects.get(id=pk)
            course = Class.objects.get(id=assignment.course.id)
            group = AssignmentGroup.objects.create(assignment=assignment)
            print("REQUEST:", request.data)
            student_emails = request.data.get('students', None)
            if student_emails is not None and isinstance(student_emails, list):
                users = []
                for email in student_emails:
                    try:
                        user = User.objects.get(email=email)
                        if user in course.students.all():
                            users.append(user)
                    except User.DoesNotExist:
                        continue
                group.users.set(users)
            group.save()
            queryset = AssignmentGroup.objects.filter(assignment__id=pk)
            serializer = AssignmentGroupSerializer(queryset, many=True)
            return Response(serializer.data)

    @action(detail=True, methods=['get', 'post', 'delete'])
    def extensions(self, request, pk=None):
        if request.method == 'GET':
            # list extensions for assignment: api/assignments/<id>/extensions
            queryset = AssignmentDeadlineExtension.objects.filter(assignment__id=pk)
            serializer = AssignmentDeadlineExtensionSerializer(queryset, many=True)
            return Response(serializer.data)

        if request.method == 'POST':
            # create or update extensions with { extended_deadline: ISOString, students: [id,...] } (individual students) or { extended_deadline: ISOString, all: true } (whole class): api/assignments/<id>/extensions
            ext_dt_raw = request.data.get('extended_deadline', None)
            if not ext_dt_raw:
                return Response({'error': 'extended_deadline required'}, status=400)
            from django.utils.dateparse import parse_datetime
            from django.utils import timezone
            parsed = parse_datetime(ext_dt_raw)
            if parsed is None:
                return Response({'error': 'Invalid datetime format'}, status=400)
            if timezone.is_naive(parsed):
                parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
            
            assignment = Assignment.objects.get(id=pk)
            if parsed <= assignment.submission_deadline:
                return Response({'error': 'Extended deadline must be after the original submission deadline'}, status=400)

            created = []
            if bool(request.data.get('all', False)):
                ext, _ = AssignmentDeadlineExtension.objects.update_or_create(
                    assignment_id=pk, user=None, defaults={'extended_submission_deadline': parsed}
                )
                created.append(ext)

            students = request.data.get('students', None)
            if students and isinstance(students, list):
                for uid in students:
                    try:
                        ext, _ = AssignmentDeadlineExtension.objects.update_or_create(
                            assignment_id=pk, user_id=uid, defaults={'extended_submission_deadline': parsed}
                        )
                        created.append(ext)
                    except Exception:
                        continue

            serializer = AssignmentDeadlineExtensionSerializer(created, many=True)
            return Response(serializer.data)

        if request.method == 'DELETE':
            # delete class-wide and/or per-student extensions: api/assignments/<id>/extensions
            if bool(request.data.get('all', False)):
                AssignmentDeadlineExtension.objects.filter(assignment__id=pk, user__isnull=True).delete()
            students = request.data.get('students', None)
            if students and isinstance(students, list):
                AssignmentDeadlineExtension.objects.filter(assignment__id=pk, user__id__in=students).delete()
            return Response({'status': 'deleted'})


    @action(detail=True)
    def submissions(self, request, pk=None):
        # list submissions for given assignment: /api/assignments/<id>/submissions
        student = request.GET.get('student', None)
        current = True if request.GET.get('current', "").lower() in ('true', 'yes') else False
        requester_id = request.GET.get('requester', None)  # Frontend must pass the logged-in user's ID
        
        if student is None:
            # list all submissions for assignment: /api/assignments/<id>/submissions
            if requester_id and should_restrict_submission_access(pk, requester_id):
                queryset = AssignmentSubmission.objects.filter(assignment__id=pk, user__id=requester_id)
                serializer = SubmissionSerializer(queryset, many=True)
                return Response(serializer.data)

            queryset = AssignmentSubmission.objects.filter(assignment__id=pk)
            serializer = SubmissionSerializer(queryset, many=True)
            return Response(serializer.data)
        elif not current:
            # list assignment submissions for given student: /api/assignments/<id>/submissions?student=<id>
            if requester_id and student != requester_id:
                if should_restrict_submission_access(pk, requester_id, student):
                    return Response({'error': 'Access restricted due to active extension'}, status=403)
            
            queryset = AssignmentSubmission.objects.filter(assignment__id=pk, user__id=student)
            serializer = SubmissionSerializer(queryset, many=True)
            return Response(serializer.data)
        else:
            # show current assignment submission for given student: /api/assignments/<id>/submissions?student=<id>&current=true
            if requester_id and student != requester_id:
                if should_restrict_submission_access(pk, requester_id, student):
                    return Response({'error': 'Access restricted due to active extension'}, status=403)
            
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




