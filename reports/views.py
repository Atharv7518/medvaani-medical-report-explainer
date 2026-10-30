import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import ReportJobSerializer
from .serializers import ExtractedResultSerializer, ExplanationSerializer
from .models import ExtractedResult, Explanation, ReportJob  
from .utils import extract_text_from_pdf, parse_medical_data, generate_medical_explanation, generate_doctor_questions, generate_chat_response
from gtts import gTTS
from django.core.files.base import ContentFile
import io
import re
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile 
from django.utils.timezone import localtime
from django.utils import timezone
from django.contrib.auth.models import update_last_login

import threading
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

def run_ai_extraction(report_job, file_path):
    """This function runs invisibly in the background."""
    try:
        # 1. Read the images
        raw_images = process_uploaded_file(file_path)
        
        # 2. Call OpenRouter AI
        structured_data = parse_medical_data(raw_images)
        
        # 3. Save to database
        for item in structured_data:
            ExtractedResult.objects.create(
                report=report_job,
                test_name=item.get('test_name', 'Unknown'),
                value=item.get('value', 'N/A'),
                unit=item.get('unit', 'N/A'),
                reference_range=item.get('reference_range', 'N/A')
            )
            
        # 4. Update status so frontend knows it's done
        report_job.status = 'VERIFICATION'
        report_job.save()
    except Exception as e:
        print(f"Background Task Failed: {e}")

class ReportUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ReportJobSerializer(data=request.data)
        
        if serializer.is_valid():
            report_job = serializer.save(user=request.user) 
            file_path = report_job.document.path
            
            if file_path.lower().endswith(('.pdf', '.png', '.jpg', '.jpeg')):
                # Start the background thread instead of waiting!
                thread = threading.Thread(target=run_ai_extraction, args=(report_job, file_path))
                thread.start()
            
            # Immediately return a 202 Accepted response so the UI doesn't freeze
            return Response(
                {"id": report_job.id, "message": "File accepted. AI is processing in the background."}, 
                status=status.HTTP_202_ACCEPTED
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ExtractedDataView(APIView):
    def get(self, request, job_id):
        results = ExtractedResult.objects.filter(report__id=job_id)
        serializer = ExtractedResultSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, job_id):
        updated_items = request.data
        
        for item in updated_items:
            try:
                result = ExtractedResult.objects.get(id=item['id'], report__id=job_id)
                result.value = item['value']
                result.is_uncertain = False 
                result.save()
            except ExtractedResult.DoesNotExist:
                continue
                
        return Response({"message": "Data verified and updated"}, status=status.HTTP_200_OK)

class GenerateExplanationView(APIView):
    def get(self, request, job_id):
        try:
            explanation = Explanation.objects.get(report__id=job_id)
            serializer = ExplanationSerializer(explanation)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Explanation.DoesNotExist:
            return Response({"error": "Explanation not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, job_id):
        try:
            report_job = ReportJob.objects.get(id=job_id)
            results = ExtractedResult.objects.filter(report=report_job)
            
            # 1. Generate the Text Explanation
            real_ai_text = generate_medical_explanation(
                extracted_results=results, 
                target_language=report_job.target_language
            )
            
            # 2. Save the text to the database first
            explanation, created = Explanation.objects.update_or_create(
                report=report_job,
                defaults={'summary': real_ai_text}
            )
            
            # 3. Convert that text to Voice (MP3)
            try:
                clean_text = real_ai_text.replace('*', '') 
                
                lang_code = 'hi'
                if report_job.target_language == 'Punjabi':
                    lang_code = 'pa'
                elif report_job.target_language == 'English':
                    lang_code = 'en'
                    
                tts = gTTS(text=clean_text, lang=lang_code, slow=False)
                
                fp = io.BytesIO()
                tts.write_to_fp(fp)
                filename = f"explanation_{job_id}.mp3"
                explanation.audio.save(filename, ContentFile(fp.getvalue()))
            except Exception as e:
                print("Audio generation failed:", e)
            
            report_job.status = 'COMPLETED'
            report_job.save()
            
            # 4. Send the text AND the audio link back to React
            serializer = ExplanationSerializer(explanation)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ReportJob.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

class DoctorPrepView(APIView):
    def get(self, request, job_id):
        try:
            report_job = ReportJob.objects.get(id=job_id)
            results = ExtractedResult.objects.filter(report=report_job)
            
            questions_text = generate_doctor_questions(
                extracted_results=results, 
                target_language=report_job.target_language
            )
            
            return Response({"questions": questions_text}, status=status.HTTP_200_OK)
            
        except ReportJob.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        reports = ReportJob.objects.filter(user=request.user).order_by('-uploaded_at')
        serializer = ReportJobSerializer(reports, many=True)
        return Response(serializer.data)

class ReportChatView(APIView):
    def post(self, request, job_id):
        user_question = request.data.get('question')
        
        if not user_question:
            return Response({"error": "Question is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            report_job = ReportJob.objects.get(id=job_id)
            results = ExtractedResult.objects.filter(report=report_job)
            
            explanation = Explanation.objects.filter(report=report_job).first()
            exp_text = explanation.summary if explanation else ""
            
            answer = generate_chat_response(
                extracted_results=results,
                explanation_text=exp_text,
                user_question=user_question,
                target_language=report_job.target_language
            )
            
            return Response({"answer": answer}, status=status.HTTP_200_OK)
            
        except ReportJob.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)

class TrendTrackerView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        results = ExtractedResult.objects.filter(
            is_uncertain=False,
            report__user=request.user 
        ).select_related('report').order_by('report__uploaded_at')
        
        trends = {}
        
        for res in results:
            match = re.search(r'\d+(\.\d+)?', res.value)
            if match:
                num_value = float(match.group())
                test_name = res.test_name.title().strip() 
                
                if test_name not in trends:
                    trends[test_name] = {"unit": res.unit, "history": []}
                    
                trends[test_name]["history"].append({
                    "date": res.report.uploaded_at.strftime("%b %d, %Y"),
                    "value": num_value
                })
                
        return Response(trends, status=status.HTTP_200_OK)

class AIEvaluationDashboardView(APIView):
    def get(self, request):
        total_reports = ReportJob.objects.count()
        completed_reports = ReportJob.objects.filter(status='COMPLETED').count()
        
        total_extractions = ExtractedResult.objects.count()
        uncertain_extractions = ExtractedResult.objects.filter(is_uncertain=True).count()
        
        ocr_accuracy = 100.0
        if total_extractions > 0:
            ocr_accuracy = round(((total_extractions - uncertain_extractions) / total_extractions) * 100, 1)
            
        audio_generated = Explanation.objects.exclude(audio__exact='').count()
        
        data = {
            "total_reports_processed": total_reports,
            "pipeline_success_rate": round((completed_reports / total_reports * 100), 1) if total_reports > 0 else 0,
            "total_data_points_extracted": total_extractions,
            "ocr_confidence_rate": ocr_accuracy,
            "audio_generation_success": audio_generated
        }
        
        return Response(data, status=status.HTTP_200_OK)

class SignupView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        phone = request.data.get('phone')
        age = request.data.get('age')
        password = request.data.get('password')

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists"}, status=400)
        if UserProfile.objects.filter(phone_number=phone).exists():
            return Response({"error": "Phone already exists"}, status=400)

        user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
        UserProfile.objects.create(user=user, phone_number=phone, age=age)

        refresh = RefreshToken.for_user(user)
        return Response({"access": str(refresh.access_token), "is_admin": user.is_staff}, status=201)

class CustomLoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        login_id = request.data.get('login_id') 
        password = request.data.get('password')

        if not login_id or not password:
            return Response({"error": "Please provide both login ID and password."}, status=400)

        user = User.objects.filter(Q(email=login_id) | Q(profile__phone_number=login_id)).first()

        if not user:
            user = User.objects.filter(username=login_id).first()

        if not user:
            return Response({"error": "Invalid email, phone, or username."}, status=400)

        if user.check_password(password):
            update_last_login(None, user)
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token), 
                "is_admin": user.is_staff
            }, status=200)
        
        return Response({"error": "Incorrect password"}, status=400)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        if hasattr(request.user, 'profile'):
            request.user.profile.last_logout = timezone.now()
            request.user.profile.save()
        return Response({"message": "Logged out successfully"}, status=200)

class AdminUserAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        users = User.objects.all().select_related('profile')
        user_data = []
        for u in users:
            report_count = ReportJob.objects.filter(user=u).count()
            profile = getattr(u, 'profile', None)
            user_data.append({
                "id": u.id,
                "name": u.first_name,
                "email": u.email,
                "phone": profile.phone_number if profile else "N/A",
                "reports_generated": report_count,
                "is_admin": u.is_staff,
                
                "last_login": localtime(u.last_login).strftime("%b %d, %Y %I:%M %p") if u.last_login else "Never",
                "last_logout": localtime(profile.last_logout).strftime("%b %d, %Y %I:%M %p") if profile and profile.last_logout else "Never"
            })
        return Response(user_data, status=200)

class AdminManageUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        if not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=403)
            
        reports = ReportJob.objects.filter(user_id=user_id).order_by('-uploaded_at')
        serializer = ReportJobSerializer(reports, many=True)
        return Response(serializer.data, status=200)

    def delete(self, request, user_id):
        if not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=403)
            
        User.objects.filter(id=user_id).delete()
        return Response({"message": "User and all data completely deleted"}, status=200)