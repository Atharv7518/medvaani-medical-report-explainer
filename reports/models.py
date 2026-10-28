from django.db import models
from django.contrib.auth.models import User
import uuid

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    last_logout = models.DateTimeField(null=True, blank=True)

class ReportJob(models.Model):
    # We use a UUID instead of an ID like '1' or '2' for better privacy
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # NEW: Link this report to a specific user
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    # This is where the file will be saved
    document = models.FileField(upload_to='medical_reports/')
    
    # What language does the user want the explanation in?
    target_language = models.CharField(max_length=50, default='Hindi')
    
    # Track what is happening with this file
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing OCR'),
        ('VERIFICATION', 'Awaiting Verification'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Automatically record when this was uploaded
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report {self.id} - {self.status}"

class ExtractedResult(models.Model):
    # This links every test back to the specific uploaded file
    report = models.ForeignKey(ReportJob, on_delete=models.CASCADE, related_name='results')
    
    # The actual data we want to extract
    test_name = models.CharField(max_length=255)
    value = models.CharField(max_length=100)
    unit = models.CharField(max_length=100, blank=True, null=True)
    reference_range = models.CharField(max_length=255, blank=True, null=True)
    
    # Highlight uncertain values for human verification
    is_uncertain = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.test_name}: {self.value} {self.unit}"

class Explanation(models.Model):
    # This links the explanation directly to the uploaded report
    report = models.OneToOneField(ReportJob, on_delete=models.CASCADE, related_name='explanation')
    
    # This will hold the simple, easy-to-understand text
    summary = models.TextField()

    # A place to save the voice file
    audio = models.FileField(upload_to='audio_explanations/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Explanation for Report {self.report.id}"