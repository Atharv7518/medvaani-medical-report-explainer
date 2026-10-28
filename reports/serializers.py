from rest_framework import serializers
from .models import ReportJob, ExtractedResult, Explanation

class ReportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportJob
        # We want to return the ID, the document, the language, and the status
        fields = ['id', 'document', 'target_language', 'status', 'uploaded_at']
        # The user won't send the ID or status, so we make them read-only
        read_only_fields = ['id', 'status', 'uploaded_at']

class ExtractedResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractedResult
        fields = ['id', 'test_name', 'value', 'unit', 'reference_range', 'is_uncertain']

class ExplanationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Explanation
        fields = ['id', 'summary', 'audio', 'created_at'] # We added 'audio' here