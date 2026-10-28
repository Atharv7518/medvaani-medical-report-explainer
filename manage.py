#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# ABSOLUTELY FIRST: Fix for Python 3.14 Protobuf issue
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"

def main():
    """Run administrative tasks."""
    # THIS IS THE CRITICAL LINE: It points exactly to the 'backend' folder shown in your screenshot
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings') 
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()