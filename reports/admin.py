from django.contrib import admin
from .models import ReportJob, ExtractedResult

# This tells Django to show these tables in the Admin Dashboard
admin.site.register(ReportJob)
admin.site.register(ExtractedResult)